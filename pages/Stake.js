import {useWeb3Contract} from "react-moralis"
import {stkAbi, lamAbi, contractAddresses} from "../constants"
import {useMoralis} from "react-moralis"
import { useEffect, useState } from "react"
import {ethers} from "ethers"
import {useNotification} from "web3uikit"
import styles from "../styles/Stake.module.css"

export default function Stake(){
    function printEth(bigNum, decimals){
        bigNum = ethers.utils.formatEther(bigNum)
        let idx = bigNum.indexOf('.')    
        return bigNum.slice(0,idx+decimals+1)
    }

    const {chainId: cidHex, isWeb3Enabled, account} = useMoralis()
    const chainId = parseInt(cidHex)
    const stkAddress = chainId in contractAddresses ? contractAddresses[chainId][4] : null
    const lamAddress = chainId in contractAddresses ? contractAddresses[chainId][3] : null

    const standardOptions = {
        abi: stkAbi,
        contractAddress: stkAddress,
    }
    const lamStandardOptions = {
        abi: lamAbi,
        contractAddress: lamAddress,
    }
    const {runContractFunction: stakeToken} = useWeb3Contract()    
    const {runContractFunction: approve} = useWeb3Contract()
    const {runContractFunction: dailyRewards} = useWeb3Contract()
    const {runContractFunction: currentDay} = useWeb3Contract()
    const {runContractFunction: claimRewards} = useWeb3Contract()
    const {runContractFunction: getFromDayNo} = useWeb3Contract()

    const [amtToStk, setAmtToStk] = useState(0)
    const [dailyRev, setDailyRev] = useState([])
    const stkInfosdiv = dailyRev.map((e,ind)=>(
        <div style={{margin:"10px", opacity:0.5}} key={ind}>
            <div style={{backgroundColor:"#3a04a6", padding:"5px", color:"#d5c3f2", fontSize:"13px", display:"flex", justifyContent:"space-between"}}>
                <div>Day {e[3]}</div>                
            </div>
            <div className={styles.card} style={{fontSize:"14px"}}>
                <li style={{color:"#d5c3f2"}}>Staked: {printEth(e[1],4)} LAM</li>
                <li style={{color:"#d5c3f2"}}>Staking Rewards: {printEth(e[0],4)} LAM</li>                
                <li style={{color:"#8d95f4"}}>Dividends: {printEth(e[2],4)} BNB</li>                
            </div>
        </div>
    ))
    
    const dispatch = useNotification()

    function handleChange(e){
        setAmtToStk(e.target.value)
    }
    
    const handleNewNotification = function(){
        dispatch({
            type:"info",
            message:"Txn complete!",
            position: "topR",
            icon: "bell"
        })
    }

    async function updateUI(){
        let daily_rev = []
        let cur_day = (await currentDay({params:{...standardOptions, functionName:"currentDay"}})).toNumber()        
        let tokensToUnstake = ethers.BigNumber.from('0')
        for(let i=0;i<cur_day;i++){
            let daily_rewards = await dailyRewards({
                params:{
                    ...standardOptions,
                    functionName: "dailyRewards(uint256,uint256)",
                    params: {_dayNo: i, _prevDayTokens: tokensToUnstake}
                }
            })
            tokensToUnstake = tokensToUnstake.add(daily_rewards[1])
            daily_rewards = daily_rewards.map((e)=>e.toString())
            daily_rewards.push(i)
            daily_rev.push(daily_rewards.map((e)=>e.toString()))
        }
        setDailyRev(daily_rev)        
    }
    useEffect(()=>{
        if(isWeb3Enabled){
            updateUI()
        }
    },[isWeb3Enabled])

    const handleSuccess = async function(tx){
        await tx.wait(1)
        handleNewNotification(tx)
        await updateUI()
    }

    return (
        <div style={{textAlign:'center'}} className={styles.container}>
            <h1 style={{margin:'2rem'}}>Stake LAM</h1>
            <input onChange={handleChange}></input><br></br>
            <button onClick={async ()=>{                
                await approve({
                    params:{
                        ...lamStandardOptions, functionName:"approve", params:{spender: stkAddress, amount: ethers.utils.parseEther(amtToStk.toString())}
                    }
                })
                await stakeToken({
                    params:{
                        ...standardOptions,functionName:"stakeToken",params:{amount: ethers.utils.parseEther(amtToStk.toString())},//msgValue: 0,
                        onSuccess: handleSuccess,
                        onError: (e)=>console.log(e),
                    }                    
                })
            }}>Stake</button>
            <div className={styles.cards}>
            {stkInfosdiv}
            </div>            
            {dailyRev.length ?
                <button style={{fontSize:'20px', padding:"5px", margin:"9px 0px 0px 0px"}} onClick={async()=>{
                    await claimRewards({
                        params:{...standardOptions,functionName:"claimRewards"},
                        onSuccess: handleSuccess,
                        onError: (e)=>console.log(e),
                    })
                }}>Collect Rewards!</button>
            : ""}
            
        </div>
    )

}