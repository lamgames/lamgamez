import '../styles/globals.css'
import {MoralisProvider} from "react-moralis"
import {NotificationProvider} from "web3uikit"
import Header from '../components/Header'

function MyApp({ Component, pageProps }) {
  return (
    <MoralisProvider initializeOnMount={false}>
      <NotificationProvider>
        <Header/>
        <Component {...pageProps}/>
      </NotificationProvider>
    </MoralisProvider>
  )
}

export default MyApp
