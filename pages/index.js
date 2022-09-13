import styles from '../styles/Home.module.css'
// import Header from '../components/Header'
// import PricePrediction from './PricePrediction'
import Link from 'next/link'

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <Link href='/PricePrediction'>Price Prediction</Link><br/>
      </div>
      <div className={styles.card}>
        <Link href='/JanKenPon'>JanKenPon</Link><br/>
      </div>      
      <div className={styles.card}>
        <Link href='/Lottery'>Lottery</Link>
      </div>
    </div>
  )
}
