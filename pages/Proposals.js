import {useWeb3Contract} from "react-moralis"
import {lamAbi, contractAddresses} from "../constants"
import {useMoralis} from "react-moralis"
import { useEffect, useState } from "react"
import {ethers} from "ethers"
import {useNotification} from "web3uikit"
import ppStyles from '../styles/PricePrediction.module.css'

export default function PricePrediction(){    
    
    const {chainId: cidHex, isWeb3Enabled} = useMoralis()
    const chainId = parseInt(cidHex)
    const lamAddress = chainId in contractAddresses ? contractAddresses[chainId][3] : null    
    
    const standardOptions = {
        abi: lamAbi,
        contractAddress:lamAddress,
    }

    const [proposals, setProposals] = useState([])    

    const ppInfosdiv = proposals.map((info,ind)=> { 
            return (
                <div style={{margin:"10px"}} key={ind}>
                    <div style={{backgroundColor:"#3a04a6", padding:"5px", color:"#d5c3f2", fontSize:"13px", display:"flex", justifyContent:"space-between"}}>
                            <div># {info['i']}</div>                            
                    </div>
                    <div className={ppStyles.card} style={{alignItems:"center"}}>
                        <li>Contract Address</li>
                        <li>{info['address']}</li>
                        <button className={ppStyles.btnBull} style={{fontSize:"15px", height:"100%", padding:"5px", margin:"10px 0 0 0 "}} 
                            onClick={async()=>{
                                await voteProposal({
                                    onSuccess: handleSuccess,
                                    onError: (e)=>console.log(e),
                                    params: {...standardOptions, functionName:"voteProposal(uint256,bool)", params:{_proposal_idx:info['i'], vote:true}}
                                })
                            }}> 
                            Upvotes - {ethers.utils.formatEther(info['upVotes'])} 
                        </button>
                        <button className={ppStyles.btnBear} style={{fontSize:"15px", height:"100%", padding:"5px"}}
                            onClick={async()=>{
                                await voteProposal({
                                    onSuccess: handleSuccess,
                                    onError: (e)=>console.log(e),
                                    params: {...standardOptions, functionName:"voteProposal(uint256,bool)", params:{_proposal_idx:info['i'], vote:false}}
                                })
                            }}> 
                            Downvotes - {ethers.utils.formatEther(info['downVotes'])} 
                        </button>                                    
                    </div>
                </div>
            )
        }
    )
    
    const dispatch = useNotification()
    
    const {runContractFunction: getProposal} = useWeb3Contract()
    const {runContractFunction: voteProposal} = useWeb3Contract()
    const {runContractFunction: getNumProposals} = useWeb3Contract()

    async function updateUI(){
        let numProposals = (await getNumProposals({params: {...standardOptions, functionName:"getNumProposals"}})).toNumber()
        
        let newProposal = []
        for(let i=0; i<numProposals; i++){
            let a = await getProposal({params: {...standardOptions, functionName:"getProposal(uint256)", params:{idx:i}}});
            
            let proposalInfoTemplate = {
                "address":a[0],
                "role": a[1],
                "upVotes":a[2],
                "downVotes":a[3],
                "startTimeStamp":a[4],
                "approved":a[5],
                "i":i,
            }            
            // console.log(i<=curGameNo-2,a['claimRewards'])
            
            newProposal.push(proposalInfoTemplate)
        }
        newProposal = newProposal.reverse()
        setProposals(newProposal)
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
            <h1 style={{textAlign:'center', margin:'1rem'}}>Proposals</h1>
            {lamAddress ? (
                <div style={{margin:"50px 0 0 0"}}>
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