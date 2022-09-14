import {useWeb3Contract} from "react-moralis"
import {jkpAbi, contractAddresses} from "../constants"
import {useMoralis} from "react-moralis"
import { useEffect, useState } from "react"
import {ethers} from "ethers"
import io from 'socket.io-client'
import {useNotification} from "web3uikit"
import ClipLoader from 'react-spinners/ClipLoader';
import styles from '../styles/jkp.module.css'

// const socket = io({closeOnBeforeunload: false})
const socket = io("https://lamgames.herokuapp.com", {closeOnBeforeunload: false})
// const socket = io.connect()

export default function JanKenPon(){

    const {chainId: cidHex, isWeb3Enabled, account} = useMoralis()
    const chainId = parseInt(cidHex)
    const ppAddress = chainId in contractAddresses ? contractAddresses[chainId][1] : null
    const dispatch = useNotification()
    
    const standardOptions = {
        abi: jkpAbi,
        contractAddress:ppAddress,
    }
    let getcheckIfPlayedOptions = {
      ...standardOptions,
      functionName: "getcheckIfPlayed",
    }
    let enterJKP1Options = {
      ...standardOptions,
      functionName: "enterJKP1",
      msgValue: ethers.utils.parseEther("0.005")
    }
    const {runContractFunction: getcheckIfPlayed} = useWeb3Contract()
    const {runContractFunction: getRewards} = useWeb3Contract()
    const {runContractFunction: withdraw} = useWeb3Contract()
    const {runContractFunction: enterJKP1} = useWeb3Contract()
    
    const maxMoves = 3;
    const [messageReceived, setMessageReceived] = useState("")
    const [userRewards, setUserRewards] = useState('0')
    const [result, setResult] = useState("")
    const [gameState, setGameState] = useState("Waiting for player...")
    const [moves, setMoves] = useState([])
    const [opponentMoves, setOpponentMoves] = useState([])
    const [ifPlayed, setIfPlayed] = useState(false)
    const [winLose, setWinLose] = useState("")

    // console.log('==> both moves ', moves, opponentMoves)
    const moveDivs = moves.map((move,ind)=>{return <div key={ind}>
      {move == 0 ? <img src="rock.png" height="50px" width="50px"/> : move==1 ?<img src="paper.png" height="50px" width="50px"/> : <img src="scissor.png" height="50px" width="50px"/>}
    </div>})
    const opponentMoveDivs = opponentMoves.map((move,ind)=>{return <div key={ind}>
      {move == 0 ? <img src="rock.png" height="50px" width="50px"/> : move==1 ?<img src="paper.png" height="50px" width="50px"/> : <img src="scissor.png" height="50px" width="50px"/>}
    </div>})
    let setWinDiv = []
    function getWinner(a,b){      
      if( (a+1)%3 == b) return 2;
      if( (b+1)%3 == a) return 1;
      return 0;
    }
    for(let i=0;i<opponentMoveDivs.length;i++){
      let gw = getWinner(moves[i],opponentMoves[i])
      gw = gw == 0 ? "Draw" : gw == 1 ? "Win" : "Lose"
      setWinDiv.push(<div style={{margin:"21px"}}> {gw} </div>)
    }
    // console.log(setWinDiv)
    function playMove(move){
        if(moves.length !== maxMoves){    
          if(moves.length == opponentMoves.length){
            setMoves(prevMoves=>[...prevMoves, move])     
            console.log("played move", move) 
            socket.emit('play_turn', {'move':move, "name": account})
          }          
        }
    }
    async function updateUI(){      
      let userRewards = await getRewards({
        params: {...standardOptions,functionName: "getRewards"},
        onError: (e)=>console.log("--",e)
      })
      setUserRewards(userRewards)      
      let ifP = await getcheckIfPlayed({
        params:getcheckIfPlayedOptions,
        onError: (e)=>console.log("--",e)
      })
      console.log(ifP)
      if (ifP){
        socket.emit("join_room", account)
        setMoves([])
        setOpponentMoves([])
      }
      else{
        setGameState("Waiting for player...")
      }
      
      setIfPlayed(ifP)
    }
    const handleSuccess = async function(tx){
        await tx.wait(1)
        handleNewNotification(tx)
        updateUI()
    }
    const handleNewNotification = function(){
        dispatch({
            type:"info",
            message:"Txn complete!",
            position: "topR",
            icon: "bell"
        })
    }
    // const [socket, setSocket] = useState(null)
    useEffect(()=>{          
        socket.on("game_started", (data)=>{
          setWinLose('')
          setGameState("Game started.. Choose now")
        })
        socket.on('reveal_move',(data)=>{
          setOpponentMoves((prevMoves)=>data)
        })
        socket.on("reconnect", (data)=>{
          console.log("Reconnect ",data)
          setGameState("Game started.. Choose now")
          setMoves(data[0])
          setOpponentMoves(data[1])
        })
        socket.on("winner",async (data)=>{
          setWinLose(data[account])          
          // setMoves([])
          // setOpponentMoves([])
          
        })        
        let uui = async ()=>{
          await updateUI()
        }
        if (isWeb3Enabled)
          uui()                
      }, [isWeb3Enabled])

    const handleTabClosing = () => {
      socket.emit('before_disconnect', account)
    }
  
    const alertUser = (event) => {
        event.preventDefault()
        event.returnValue = ''
    }
    return (
        <div className="App">
            <h1 style={{textAlign:'center', margin:'1rem'}}>JanKenPon</h1>
            {!ifPlayed ? 
            <div className={styles.container}>
              <button className={styles.card} onClick={async ()=>{
                await enterJKP1({params: enterJKP1Options, onSuccess:handleSuccess, onError:(e)=>console.log(e)})
              }}>Enter </button>
              
              {userRewards != '0' ? 
              <button className={styles.card} onClick={async ()=>{
                await withdraw({params: {...standardOptions, functionName:'withdraw'}, onSuccess:handleSuccess, onError:(e)=>console.log(e)})
              }}>Claim Rewards </button> : ''}
            </div>
            : 
            <>              
              <br/>
              {gameState == "Waiting for player..." ?
              <div style={{textAlign: 'center', fontSize:"20px"}}>{gameState} <br/><br/> <ClipLoader color={'#fff'} size={150} speedMultiplier={0.5} /></div> : 
              <div>
                <div style={{display:"flex", justifyContent:"center"}}>
                    <button className={styles.rockBtn} onClick={()=>playMove(0)}></button> 
                    <button className={styles.paperBtn} onClick={()=>playMove(1)}></button> 
                    <button className={styles.scissorBtn} onClick={()=>playMove(2)}></button>
                </div>
                <section className={styles.moves_section}>
                    <div>
                        {moveDivs}
                    </div>
                    <div style={{margin:"0 100px 0 100px"}}>
                      {setWinDiv}
                    </div>
                    <div>
                        {opponentMoveDivs}
                    </div>
                </section>
                {winLose != '' ?
                <div style={{textAlign:"center", margin:'50px'}}>
                  <div>{winLose}</div>
                  <button className={styles.card} style={{fontSize:"20px", padding:"10px"}} onClick={async ()=>{
                      setTimeout(async function(){ await updateUI() }, 1000);                    
                  }}>Continue </button> 
                </div> :
                ''}
              </div>
              }                                    
            </>}     
        </div>
    )

}