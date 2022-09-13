import Link from "next/link"
import {ConnectButton} from "web3uikit"
import styles from "../styles/NavBar.module.css"

export default function Header(){
    return (
        // <div style={{display: "flex", justifyContent: "flex-end"}}>
        //     <ConnectButton moralisAuth={false}/>
        // </div>        
        <div className={styles.navbar}>
            <ConnectButton style={{display: "flex", justifyContent: "flex-end", fontSize:"10"}}moralisAuth={false}/>
            <h1><Link href='/'>LamGames</Link></h1>
            <ul>
            <li><Link href='/'>Games</Link></li>
            <li><Link href='/BuyLam'>Buy LAM</Link></li>
            <li><Link href='/Stake'>Stake</Link></li>
            <li><Link href='/Proposals'>Proposals</Link></li>
            <li>Whitepaper</li>            
        </ul>
        </div>
    )
}