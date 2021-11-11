/*
 * We are going to be using the useEffect hook!
 */
import './App.css';
import { useEffect, useState, useCallback } from 'react';
import { Connection, PublicKey, clusterApiUrl} from '@solana/web3.js';
import {
  Program, Provider, web3, BN
} from '@project-serum/anchor';
import twitterLogo from './assets/twitter-logo.svg';
import idl from './idl.json';
import kp from './keypair.json'

// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair } = web3;

const secretKeyArr = Object.values(kp._keypair.secretKey)
const secret = new Uint8Array(secretKeyArr)
const baseAccount = Keypair.fromSecretKey(secret)

// Get our program's id form the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Set our network to devent.
const network = clusterApiUrl('devnet');

// Control's how we want to acknowledge when a trasnaction is "done".
const opts = {
  preflightCommitment: "processed"
}

// Change this up to be your Twitter if you want.
const TWITTER_HANDLE = '_buildspace';
const TWITTER_DEVELOPER = 'LkRuiZ';
const getTwitterLink = (username) => `https://twitter.com/${username}`;

// const TEST_GIFS = [
// 	'https://media0.giphy.com/media/5K7cWu5Am8Feo/giphy.webp?cid=ecf05e47z5dbw7x0eousrwq1y0ylw30ivzqq5qm8xfbzj5pw&rid=giphy.webp&ct=g',
// 	'https://media2.giphy.com/media/40F4fLvOkInEk/200w.webp?cid=ecf05e47z5dbw7x0eousrwq1y0ylw30ivzqq5qm8xfbzj5pw&rid=200w.webp&ct=g',
// 	'https://media3.giphy.com/media/kAbWiuvtzoG3e/giphy.webp?cid=ecf05e47z5dbw7x0eousrwq1y0ylw30ivzqq5qm8xfbzj5pw&rid=giphy.webp&ct=g',
// 	'https://media4.giphy.com/media/3d78jQ2gNDv3AqfSiI/200w.webp?cid=ecf05e4736f76xlpop0a7efdk6mkfy6k5300jryeszd9qjdq&rid=200w.webp&ct=g'
// ];


const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [gifList, setGifList] = useState([]);

  /*
   * This function holds the logic for deciding if a Phantom Wallet is
   * connected or not
   */
  const checkIfWalletIsConnected = async () => {
    try {
      const { solana } = window;

      if (solana) {
        if (solana.isPhantom) {
          console.log('Phantom wallet found!');
          const response = await solana.connect({ onlyIfTrusted: true });
          console.log(
            'Connected with Public Key:',
            response.publicKey.toString()
          );

          /*
           * Set the user's publicKey in state to be used later!
           */
          setWalletAddress(response.publicKey.toString());
        }
      } else {
        alert('Solana object not found! Get a Phantom Wallet 👻');
      }
    } catch (error) {
      console.error(error);
    }
  };

  /*
    * Let's define this method so our code doesn't break.
    * We will write the logic for this next!
    */
  const connectWallet = async () => {
    const { solana } = window;

    if (solana) {
      const response = await solana.connect();
      console.log('Connected with Public Key:', response.publicKey.toString());
      setWalletAddress(response.publicKey.toString());
    }
  };

  const sendGif = async () => {
    if (inputValue.length === 0) {
      console.log("No gif link given!")
      return
    }
    console.log('Gif link:', inputValue);
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.addGif(inputValue, {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF sucesfully sent to program", inputValue)
      
      setInputValue('');

      await getGifList();
    } catch (error) {
      console.log("Error sending GIF:", error)
    }
  };

  const upvoteGif = async (index) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.upvoteGif(new BN(index.toString()), {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF sucesfully upvoted", index)

      await getGifList();
    } catch (error) {
      console.log("Error upvoting GIF:", error)
    }
  }

  const downvoteGif = async (index) => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);

      await program.rpc.downvoteGif(new BN(index.toString()), {
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
        },
      });
      console.log("GIF sucesfully downvoted", index)

      await getGifList();
    } catch (error) {
      console.log("Error downvoting GIF:", error)
    }
  }

  const sendTip = async (pubkey) => {
    try {
      const provider = getProvider();
      
      const transaction = new web3.Transaction().add(
        web3.SystemProgram.transfer({
          fromPubkey: provider.wallet.publicKey,
          toPubkey: pubkey,
          lamports: web3.LAMPORTS_PER_SOL / 100,
        })
      );

      const tx = await provider.send(transaction);

      console.log("Tip sent sucesfully Tx:", tx)
    } catch (error) {
      console.log("Error sending tip:", error)
    }
  }

  const onInputChange = (event) => {
    const { value } = event.target;
    setInputValue(value);
  };

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment);
    const provider = new Provider(
      connection, window.solana, opts.preflightCommitment,
    );
    return provider;
  }

  const createGifAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      console.log("ping")
      await program.rpc.startStuffOff({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount]
      });
      console.log("Created a new BaseAccount w/ address:", baseAccount.publicKey.toString())
      await getGifList();

    } catch(error) {
      console.log("Error creating BaseAccount account:", error)
    }
  }

  /*
    * We want to render this UI when the user hasn't connected
    * their wallet to our app yet.
    */
  const renderNotConnectedContainer = () => (
    <button
      className="cta-button connect-wallet-button"
      onClick={connectWallet}
    >
      Connect to Wallet
    </button>
  );

  const renderConnectedContainer = () => {
    // If we hit this, it means the program account hasn't be initialized.
    if (gifList === null) {
      return (
        <div className="connected-container">
          <button className="cta-button submit-gif-button" onClick={createGifAccount}>
            Do One-Time Initialization For GIF Program Account
          </button>
        </div>
      )
    } 
    // Otherwise, we're good! Account exists. User can submit GIFs.
    else {
      return(
        <div className="connected-container">
          <input
            type="text"
            placeholder="Enter gif link!"
            value={inputValue}
            onChange={onInputChange}
          />
          <button className="cta-button submit-gif-button" onClick={sendGif}>
            Submit
          </button>
          <div className="gif-grid">
            {/* We use index as the key instead, also, the src is now item.gifLink */}
            {gifList.map((item, index) => (
              <div className="gif-item" key={index}>
                <img src={item.gifLink} />
                <span>{item.userAddress.toString()}</span>
                <div className="button-row">
                  <button className="cta-button upvote-button" onClick={() => upvoteGif(index)}>
                    {`👍 ${item.upvotes}`}
                  </button>
                  <button className="cta-button downvote-button" onClick={() => downvoteGif(index)}>
                    {`👎 ${item.downvotes}`}
                  </button>
                  <button className="cta-button downvote-button" onClick={() => sendTip(item.userAddress)}>
                    💸  Send a tip
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  /*
   * When our component first mounts, let's check to see if we have a connected
   * Phantom Wallet
   */
  useEffect(() => {
    const onLoad = async () => {
      await checkIfWalletIsConnected();
    };
    window.addEventListener('load', onLoad);
    return () => window.removeEventListener('load', onLoad);
  }, []);

  const getGifList = useCallback(async() => {
    try {
      const provider = getProvider();
      const program = new Program(idl, programID, provider);
      const account = await program.account.baseAccount.fetch(baseAccount.publicKey);
      
      console.log("Got the account", account)
      setGifList(account.gifList)

    } catch (error) {
      console.log("Error in getGifs: ", error)
      setGifList(null);
    }
  }, [])

  useEffect(() => {
    if (walletAddress) {
      console.log('Fetching GIF list...');
      getGifList()
    }
  }, [walletAddress, getGifList]);

  return (
    <div className="App">
      {/* This was solely added for some styling fanciness */}
			<div className={walletAddress ? 'authed-container' : 'container'}>
        <div className="header-container">
          <p className="header">🦝 GIF Portal</p>
          <p className="sub-text">
            View your Raccoon GIF collection in the metaverse ✨
          </p>
          
          {
            walletAddress 
            ? renderConnectedContainer()
            : renderNotConnectedContainer()
          }
        </div>
        <div className="footer-container">
          <img alt="Twitter Logo" className="twitter-logo" src={twitterLogo} />
          <a
            className="footer-text"
            href={getTwitterLink(TWITTER_HANDLE)}
            target="_blank"
            rel="noreferrer"
          >{`built on @${TWITTER_HANDLE}`}</a>
          &nbsp;
          <a
            className="footer-text"
            href={getTwitterLink(TWITTER_DEVELOPER)}
            target="_blank"
            rel="noreferrer"
          >{`by @${TWITTER_DEVELOPER}`}</a>
        </div>
      </div>
    </div>
  );
};

export default App;