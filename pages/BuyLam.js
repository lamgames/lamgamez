import {useWeb3Contract} from "react-moralis"
import {lamAbi, contractAddresses} from "../constants"
import {useMoralis} from "react-moralis"
import { useEffect, useState } from "react"
import {ethers} from "ethers"
import {useNotification} from "web3uikit"
import jkpStyles from '../styles/jkp.module.css'

export default function BuyLam(){

    const {chainId: cidHex, isWeb3Enabled, account} = useMoralis()
    const chainId = parseInt(cidHex)
    const lamAddress = chainId in contractAddresses ? contractAddresses[chainId][3] : null

    const standardOptions = {
        abi: lamAbi,
        contractAddress: lamAddress,
    }
    const {runContractFunction: publicSaleMint} = useWeb3Contract()
    const {runContractFunction: getPublicSaleCost} = useWeb3Contract()

    const [toBuy, setToBuy] = useState(0)
    const [costToken, setCostToken] = useState(ethers.BigNumber.from("0"))
    const dispatch = useNotification()

    function handleChange(e){
        if (e.target.value == '') setToBuy(0)
        else setToBuy(e.target.value)
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
        let psc = await getPublicSaleCost({
            params:{
                ...standardOptions,functionName:'getPublicSaleCost',
                onSuccess: handleSuccess,
                onError: (e)=>console.log(e),
            }            
        })
        console.log(psc)
        setCostToken(psc)
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
        <div style={{textAlign:'center'}}>            
            <h1 style={{margin:'2rem'}}>Buy LAM</h1>            
            <input type='number' className={jkpStyles.inp} onChange={handleChange} ></input><br></br>
            
            <button className={jkpStyles.card} style={{fontSize:'15px', padding:"0.5rem", margin:"1px"}} onClick={async ()=>{
                console.log(toBuy.toString())
                await publicSaleMint({
                    params:{
                        ...standardOptions,functionName:"publicSaleMint",params:{to: account},msgValue: costToken.mul(toBuy),
                        onSuccess: handleSuccess,
                        onError: (e)=>console.log(e),
                    }                    
                })
            }}>Buy {toBuy} LAM with {ethers.utils.formatEther(costToken.mul(toBuy))} BNB</button>
            <h4 style={{margin:"10px"}}> Cost of token - {ethers.utils.formatEther(costToken)} BNB</h4>
        </div>
    )

}