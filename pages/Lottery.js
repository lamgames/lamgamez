import {useWeb3Contract, useMoralisSubscription} from "react-moralis"
import {lottrAbi, contractAddresses} from "../constants"
import {useMoralis} from "react-moralis"
import { useEffect, useState } from "react"
import {ethers} from "ethers"
import {useNotification} from "web3uikit"
import ppStyles from '../styles/Lottery.module.css'
import useSWR from 'swr'

export default function Lottery(){

    const {chainId: cidHex, isWeb3Enabled, account} = useMoralis()
    const chainId = parseInt(cidHex)
    const ppAddress = chainId in contractAddresses ? contractAddresses[chainId][2] : null
    const provider = ethers.getDefaultProvider("http://127.0.0.1:8545")    
    let contract
 
    // console.log(contract)
    const standardOptions = {
        abi: lottrAbi,
        contractAddress:ppAddress,
    }

    const claimRewardsOptions = {...standardOptions, functionName: "claimRewards(uint256)"}
    const getLotteryInfoOptions = {...standardOptions, functionName: "getLotteryInfo(uint256)"}
    const checkNumTicketsWonOptions = {...standardOptions, functionName: "checkNumTicketsWon(uint256)"}    
    const getPlayerInfoOptions = {...standardOptions, functionName: "getPlayerInfo(uint256)"}
    
    const {runContractFunction: getlotteryState} = useWeb3Contract()
    const {runContractFunction: getlotteryNumber} = useWeb3Contract()    
    const {runContractFunction: checkNumTicketsWon} = useWeb3Contract()    
    const {runContractFunction: enterLottery} = useWeb3Contract()
    const {runContractFunction: claimRewards} = useWeb3Contract()        
    const {runContractFunction: getLotteryInfo} = useWeb3Contract()
    const {runContractFunction: getPlayerInfo} = useWeb3Contract()
    const {runContractFunction: getStartTimeStamp} = useWeb3Contract()
    const dispatch = useNotification()
        
    const [numTickets,setNumTickets] = useState(0)    
    const [lotInfo, setLotInfo] = useState([])    
    const [progressWidth, setProgressWidth] = useState(0)
    
    const ppInfosdiv = lotInfo.map((ppinfo, ind)=> (
        <div key={ind}>
        <div style={{backgroundColor:"#3a04a6", margin:"0px 0px 0px 0px", padding:"5px", color:"#d5c3f2", fontSize:"13px", display:"flex", justifyContent:"space-between"}}>
            {ppinfo['winTicketValue'].toString()==0 ? <div style={{position:"absolute", backgroundColor:"#8e51ef", width:progressWidth,height:"15px", opacity:"0.4"}}></div> : <></>}
            <div># {ppinfo['id']}</div>
            <div>{ppinfo['winTicketValue'].toString()==0 ? "Live" : "Completed"}</div>
        </div>
        <div className={ppStyles.card}>                        
            <h2 style={{margin:"20px 0px 0px 0px"}}>Prize Pool</h2>
            <h4>{ethers.utils.formatEther(ppinfo['ticketValue'].mul(ppinfo['numTickets']).toString())} BNB</h4>
            <br></br>
            <li style={{fontStyle:"italic"}}>Total Tickets bought: {ppinfo['numTickets'].toString()}</li>
            <li style={{fontStyle:"italic"}}>Ticket cost: {ethers.utils.formatEther(ppinfo['ticketValue'])} BNB</li>            
            <li style={{fontStyle:"italic"}}>LAM minted per ticket: {}</li>            
            <br></br>
            {ppinfo['winTicketValue']!=0? 
            <>
            <li style={{color:"#b9a2e6"}}>Total Number of Win Tickets: {ppinfo['totalNumWinTickets'].toString()}</li>
            <li style={{color:"#b9a2e6"}}>Win Ticket Value: {ethers.utils.formatEther(ppinfo['winTicketValue']).slice(0,6)}</li>
            
            {ppinfo['ntw'].toString() != 0 ?
            (   <>                
                <li style={{margin:"0px 0px 10px 0px", color:"#80eaa3"}}>Tickets Won: {ppinfo['ntw']}</li>
                <button onClick={async ()=>{
                await claimRewards({
                    params:{
                        ...claimRewardsOptions,
                        params:{index: ppinfo['id']},
                        onSuccess: handleSuccess,
                        onError: (e)=>console.log(e),
                    }
                })
            }} disabled={!ppinfo['claimed']? false : true}>{!ppinfo['claimed'] ? "Claim rewards!" : "Claimed"}</button> </>) : 'Luck favours the prepared!'}  
            </>: 
            <>
            {ppinfo['ticketsBought'].toString()==0 ? 
            <>
                <input onChange={handleTicketChange}></input><br></br>
                <button onClick={
                    async ()=>{
                        await enterLottery({
                            params: {...standardOptions, functionName:"enterLottery", msgValue: ppinfo['ticketValue'].mul(numTickets)},
                            onSuccess: handleSuccess,
                            onError: (e)=>console.log(e)                    
                        })
                    }
                }> Enter lottery</button>
            </> :             
            <>
            <li>Tickets bought: {ppinfo['ticketsBought'].toString()}</li>
            <li>LAM Received: {ethers.utils.formatEther(ppinfo['ticketsBought'].mul(ppinfo['mintPerGame']))}</li>
            </>
            }            
            </>}
                    
        </div>
        </div>
    ))

    async function updateUI(){
        let id = (await getlotteryNumber({params:{...standardOptions, functionName:'getlotteryNumber'}})).toNumber()
        let state = (await getlotteryState({params:{...standardOptions, functionName:'getlotteryState'}})).toString()
        
        let allInfos = []
        for(let i=0;i<=id;i++){
            let lInfo = await getLotteryInfo({params:{...getLotteryInfoOptions,params:{index:i}}})
            let playerInfo = (await getPlayerInfo({params:{...getPlayerInfoOptions,params:{index:i}}}))            
            let ntw;            
            if (i<id)
                ntw = (await checkNumTicketsWon({params: {...checkNumTicketsWonOptions, params:{index:i}}})).toString();
            let infoTemplate = {
                'ticketValue': lInfo[0], 
                'numTickets': lInfo[1],
                'winTicketValue': lInfo[2].toString(),
                'totalNumWinTickets': lInfo[1].mul(ethers.BigNumber.from("6")).div(ethers.BigNumber.from("10")),
                'ntw': ntw,
                'id': i,
                'claimRewards': i<id ? 
                                   ( ntw ==='0' ? undefined : true ) 
                                   : undefined,
                'mintPerGame': lInfo[5],
                'ticketsBought': playerInfo[0],
                'claimed': playerInfo[1]                
            }            
            // console.log(i,playerInfo[0].toString(), ntw.toString())
            allInfos.push(infoTemplate)
        }
        allInfos = allInfos.reverse()
        // console.log("id",id)
        setLotInfo(allInfos)
    }
    

    useEffect(()=>{
        if(isWeb3Enabled){            
            provider.on("block", async ()=>{
                let bn = await provider.getBlockNumber();      
                const startTime = await getStartTimeStamp({params:{...standardOptions,functionName:"getStartTimeStamp"}})
                const curTime = (await provider.getBlock(await provider.getBlockNumber())).timestamp
                setProgressWidth(Math.min(215,(curTime - startTime)*100/180))                
                await updateUI()
            })
            
            updateUI()
        }
        
    },[isWeb3Enabled])

    function handleTicketChange(e){
        setNumTickets(e.target.value)
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
    return (
        <>
        <h1 style={{textAlign:'center', margin:'2rem'}}>Lottery</h1>
        <div className={ppStyles.cards}>
            {ppInfosdiv}            
        </div>        
        </>
    )
}