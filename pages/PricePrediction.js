import {useWeb3Contract} from "react-moralis"
import {ppAbi, contractAddresses} from "../constants"
import {useMoralis} from "react-moralis"
import { useEffect, useState } from "react"
import {ethers} from "ethers"
import {useNotification} from "web3uikit"
import ppStyles from '../styles/PricePrediction.module.css'
import { useTimer } from 'react-timer-hook';

export default function PricePrediction(){    
    
    const {chainId: cidHex, isWeb3Enabled} = useMoralis()
    const chainId = parseInt(cidHex)
    const ppAddress = chainId in contractAddresses ? contractAddresses[chainId][0] : null
    const provider = ethers.getDefaultProvider("http://127.0.0.1:8545")
    
    const standardOptions = {
        abi: ppAbi,
        contractAddress:ppAddress,
    }
    let enterPPOptions = {
        ...standardOptions,
        functionName: "enterPP",
        params:{
            bet_bool:0
        },
        msgValue: 0
    }
    let getGameNoOptions = {
        ...standardOptions,
        functionName:"getGameNo"
    }
    let getTicketValueOptions = {
        ...standardOptions,
        functionName:"getTicketValue(uint256)"
    }
    let getMinPlayersOptions = {
        ...standardOptions,
        functionName: "getMinPlayers",        
    }
    let getPPInfoOptions = {
        ...standardOptions,
        functionName: "getPPInfo(uint256)",                
    }
    let checkWinOptions = {
        ...standardOptions,
        functionName: "checkWin(uint256)",                
    }
    let claimRewardsOptions = {
        ...standardOptions,
        functionName: "claimRewards(uint256)"
    }
    let getPlayerInfoOptions = {
        ...standardOptions,
        functionName: "getPlayerInfo(uint256)"
    }
    function enter_card(ppinfo){
        return (
        <div style={{margin:"10px"}}>
        <div style={{backgroundColor:"#3a04a6", padding:"5px", color:"#d5c3f2", fontSize:"13px", display:"flex", justifyContent:"space-between"}}>
                <div># {ppinfo['gameNo']}</div>
                <div>Next</div>
        </div>

        <h2 style={{margin:"2px 0px 0px 0px", textAlign:'center'}}>Prize Pool</h2>        
        <h4 style={{margin:"2px 0px 0px 0px", textAlign:'center'}}>{ethers.utils.formatEther(ppinfo['ticketValue'].mul(ppinfo['bearTickets'].add(ppinfo['bullTickets'])).toString())} BNB</h4>

        <h5 style={{margin:"2px 0px 0px 0px", textAlign:'center'}}>Ticket value: {ethers.utils.formatEther(ppinfo['ticketValue'])}</h5>
        <h5 style={{margin:"2px 0px 0px 0px", textAlign:'center'}}>LAM minted per ticket: {ethers.utils.formatEther(ppinfo['mintPerGame'])}</h5>

        <div style={{display:"flex", justifyContent: 'center'}}>
            <div className={ppStyles.card} >
                Bull tickets<br/> {ppinfo['bullTickets'].toString()}
                {bullButton!=0 && bullButton!=2 ? <input onChange={handleChange}></input> : ''}
                <button className={ppStyles.btnBull} onClick={async (e)=>{
                        if (bullButton==0 || bullButton == 2){
                            setBullButton(1)
                        }
                        else{
                            enterPPOptions['params']['bet_bool'] = true
                            enterPPOptions['msgValue'] = ppinfo['ticketValue'].mul(numTickets)
                            await enterPP({
                                onSuccess: handleSuccess,
                                onError: (e)=>console.log(e),
                                params: enterPPOptions
                            }) 
                        }
                    }}>BULL</button> <br/>
            </div>
            <div className={ppStyles.card} style={{textAlign:"right"}}>
                Bear tickets<br/> {ppinfo['bearTickets'].toString()}
                {bullButton!=0 && bullButton!=1 ? <input onChange={handleChange}></input> : ''}
                <button className={ppStyles.btnBear} onClick={async (e)=>{
                        if (bullButton==0 || bullButton == 1){
                            setBullButton(2)
                        }
                        else{
                            enterPPOptions['params']['bet_bool'] = false
                            enterPPOptions['msgValue'] = ppinfo['ticketValue'].mul(numTickets)
                            await enterPP({
                                onSuccess: handleSuccess,
                                onError: (e)=>console.log(e),
                                params: enterPPOptions
                            })
                        } 
                    }}>BEAR</button> <br/>
            </div>
        </div>
        {ppinfo['ticketsBought'].toString() == 0 ?"":
        <div className={ppStyles.card} style={{textAlign:"center"}}>
            <li>Tickets bought: {ppinfo['ticketsBought'].toString()}</li>
            <li>LAM minted: {ethers.utils.formatEther(ppinfo['ticketsBought'].mul(ppinfo['mintPerGame']))}</li>
            <li>BET: {ppinfo['bet'].toString() ==1 ? "BULL" : "BET"}</li>
        </div>
        }
        
        </div>
    )}

    function live_card(ppinfo){
        return (
            <div style={{margin:"10px", minWidth:"300px"}}>
                <div style={{backgroundColor:"#3a04a6", padding:"5px", color:"#d5c3f2", fontSize:"13px", display:"flex", justifyContent:"space-between"}}>
                    <div style={{position:"absolute", backgroundColor:"#8e51ef", width:progressWidth,height:"15px", opacity:"0.4"}}></div>                     
                    <div># {ppinfo['gameNo']}</div>
                    <div>Live</div>
                </div>  

                <h2 style={{margin:"2px 0px 0px 0px", textAlign:'center'}}>Prize Pool</h2>
                <h4 style={{margin:"2px 0px 0px 0px", textAlign:'center'}}>{ethers.utils.formatEther(ppinfo['ticketValue'].mul(ppinfo['bearTickets'].add(ppinfo['bullTickets'])).toString())} BNB</h4>

                <div style={{display:"flex", justifyContent: 'space-between'}}>
                    <div className={ppStyles.card} style={{width:"100%", backgroundColor: livePrice.gt(ppinfo['startPrice'])?'#4CAF50':'' }}>
                        Bull tickets<br/> {ppinfo['bullTickets'].toString()} <br/>
                    </div>
                    <div className={ppStyles.card} style={{width:"100%", backgroundColor: livePrice.gt(ppinfo['startPrice'])?'':'#f44336', textAlign:"right"}}>
                        Bear tickets<br/> {ppinfo['bearTickets'].toString()} <br/>
                    </div>
                </div>
                <div className={ppStyles.card} style={{textAlign:"center"}}>
                    {ppinfo['ticketsBought'].toString() == 0 ?"":
                    <>
                    <div> Tickets bought: {ppinfo['ticketsBought'].toString()}</div>
                    <div> BET: {ppinfo['bet'].toString() ==1 ? "BULL" : "BET"}</div>
                    </>}
                    <div>Locked Price: {ethers.utils.formatEther(ppinfo['startPrice'])}</div>
                    <div style={{color: livePrice.gt(ppinfo['startPrice'])?'green':'red' }}>Live Price: {ethers.utils.formatEther(livePrice)}</div>
                </div>
            </div>
        )
    }
    function completed_card(ppinfo){
        return (
            <div style={{backgroundColor: '#666869', margin:"20px"}} >
                <div style={{backgroundColor:"#3a04a6", padding:"5px", color:"#d5c3f2", fontSize:"13px", display:"flex", justifyContent:"space-between"}}>
                        <div># {ppinfo['gameNo']}</div>
                        <div>Completed</div>
                </div> 
                <h2 style={{margin:"2px 0px 0px 0px", textAlign:'center'}}>Prize Pool</h2>        
                <h4 style={{margin:"2px 0px 0px 0px", textAlign:'center'}}>{ethers.utils.formatEther(ppinfo['ticketValue'].mul(ppinfo['bearTickets'].add(ppinfo['bullTickets'])).toString())} BNB</h4>

                <div style={{display:"flex", justifyContent: 'space-between'}}>
                    <div className={ppStyles.card} style={{width:"100%", backgroundColor: ppinfo['endPrice'].gt(ppinfo['startPrice'])?'#4CAF50':'' }}>
                        Bull tickets<br/> {ppinfo['bullTickets'].toString()} <br/>
                    </div>
                    <div className={ppStyles.card} style={{width:"100%", backgroundColor: ppinfo['endPrice'].gt(ppinfo['startPrice'])?'':'#f44336'}}>
                        Bear tickets<br/> {ppinfo['bearTickets'].toString()} <br/>
                    </div>
                </div>
                <div className={ppStyles.card}>
                    Locked Price: {ppinfo['startPrice'].toString()} <br/>
                    End Price: {ppinfo['endPrice'].toString()} <br/>
                    Win Ticket Value: {ppinfo['winTicketValue'].toString()} <br/>                    
                    Win Bet: {ppinfo['winBet']} <br/>
                    Tickets bought: {ppinfo['ticketsBought'].toString()} <br/>
                    Your BET: {ppinfo['ticketsBought'].toString() == 0 ? '-' : ppinfo['bet']==0 ? 'BEAR' : "BULL"}<br/>
                    {ppinfo['claimRewards']==true ? 
                    (<button className={ppStyles.btnClaim} onClick={async ()=>{
                        await claimRewards({
                            params:{
                                ...claimRewardsOptions,
                                params:{index: ppinfo['gameNo']},
                                onSuccess: handleSuccess,
                                onError: (e)=>console.log(e),
                            }
                        })
                    }} disabled={!ppinfo['claimed']? false : true}>Claim Rewards!</button> ) : ''}
                </div>
            </div>
        )
    }
    
    const [bullButton, setBullButton] = useState(0)    
    const [minPlayers, setminPlayers] = useState("")
    const [numTickets, setNumTickets] = useState(0)
    const [ppInfos, setppInfos] = useState([])
    const [livePrice, setLivePrice] = useState(ethers.BigNumber.from("0"))
    const [numGamesToDisplay, setNumGamesToDisplay] = useState(10)
    const [progressWidth, setProgressWidth] = useState(290)

    const ppInfosdiv = ppInfos.map((ppinfo)=> { 
            if(ppinfo['startPrice'].toString() == 0){                
                return (                    
                    enter_card(ppinfo)
                )
            }
            else if(ppinfo['endPrice'].toString() == 0) { return live_card(ppinfo)}
            return (
                completed_card(ppinfo)
            )
        }
    )
    
    const dispatch = useNotification()
    
    const {runContractFunction: getGameNo} = useWeb3Contract()
    const {runContractFunction: enterPP} = useWeb3Contract()
    const {runContractFunction: getTicketValue} = useWeb3Contract()
    const {runContractFunction: getMinPlayers} = useWeb3Contract()      
    const {runContractFunction: getPPInfo} = useWeb3Contract()
    const {runContractFunction: checkWin} = useWeb3Contract()
    const {runContractFunction: claimRewards} = useWeb3Contract()
    const {runContractFunction: getLatestPrice} = useWeb3Contract()    
    const {runContractFunction: getPlayerInfo} = useWeb3Contract()    
    const {runContractFunction: getStartTimeStamp} = useWeb3Contract()

    async function updateUI(){
        setBullButton(0)
        let lp = await getLatestPrice({
            params:{...standardOptions, functionName:"getLatestPrice"}
        })
        setLivePrice(lp)

        let a = await getMinPlayers({ params: getMinPlayersOptions});
        setminPlayers(a.toString())
        
        let _curGameNo = await getGameNo({params: getGameNoOptions})        

        let newPPInfo = []        
        for(let i=Math.max(0, parseInt(_curGameNo)- numGamesToDisplay); i<=parseInt(_curGameNo); i++){
            a = await getPPInfo({params: {...getPPInfoOptions, params:{index:i}}});
            let playerInfo = await getPlayerInfo({params:{...getPlayerInfoOptions, params:{index:i}}})
            let tv = await getTicketValue({
                params:{...getTicketValueOptions, params:{index:i}}
            })
            let ppInfoTemplate = {
                "bearTickets":a[0],
                "bullTickets":a[1],
                "startPrice":a[2],
                'endPrice':a[3],
                "winTicketValue": a[4],
                'winBet': (a[5].toString() === '1') ? "BULL" : (i<=_curGameNo-2 ? "BEAR" : "Deciding..."),
                'mintPerGame': a[6],
                'ticketValue': tv,
                'gameNo': i,
                'claimRewards': i<=_curGameNo-2 ? await checkWin({params: {...checkWinOptions, params:{index:i}}}) : undefined,
                'ticketsBought': playerInfo[0], 'bet': playerInfo[0].toString() == 0 ? undefined : playerInfo[1].toString(),
                'claimed': playerInfo[2]
            }            
            // console.log(i<=curGameNo-2,a['claimRewards'])
            
            newPPInfo.push(ppInfoTemplate)
        }
        newPPInfo = newPPInfo.reverse()
        setppInfos(newPPInfo)
    }
    useEffect(()=>{
        if(isWeb3Enabled){
            provider.on("block", async ()=>{
                let bn = await provider.getBlockNumber();      
                const startTime = await getStartTimeStamp({params:{...standardOptions,functionName:"getStartTimeStamp"}})
                const curTime = (await provider.getBlock(await provider.getBlockNumber())).timestamp
                setProgressWidth(Math.min(290,(curTime - startTime)*100/180))                
                await updateUI()
            })
            updateUI()
        }
    },[isWeb3Enabled])

    const handleSuccess = async function(tx){
        await tx.wait(1)
        handleNewNotification(tx)
        await updateUI()
    }
    const handleNewNotification = function(){
        dispatch({
            type:"info",
            message:"Txn complete!",
            position: "topR",
            icon: "bell"
        })
    }
    function handleChange(e){
        setNumTickets(e.target.value)
    }
        
    
    return (
        <div>
            <h1 style={{textAlign:'center', margin:'1rem'}}>Price Prediction</h1>
            {ppAddress ? (
                <div>                    
                    {/* Ticket Value is {ticketValue.toString()}! <br/>
                    Min players is {minPlayers}! <br/>
                    Current game no {curGameNo} <br/> */}
                    <section className={ppStyles.cards}>
                        {ppInfosdiv}
                    </section> 
                </div>
            ) : (
                <div>
                    No PP address
                </div>
            )}            
        </div>
    )
}