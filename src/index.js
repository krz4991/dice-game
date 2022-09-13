import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import * as nearAPI from "near-api-js";
import getConfig from "./components/config.js";
import reportWebVitals from "./reportWebVitals";
import { Buffer } from "buffer";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// @ts-ignore
window.Buffer = Buffer;
// Initializing contract
async function initContract() {
  const { connect, keyStores, KeyPair, WalletConnection } = nearAPI;
  const myKeyStore = new keyStores.InMemoryKeyStore();
  const PRIVATE_KEY = process.env.REACT_APP_PV_KEY;
  // creates a public / private key pair using the provided private key
  const keyPair2 = KeyPair.fromString(PRIVATE_KEY);
  // adds the keyPair you created to keyStore
  await myKeyStore.setKey("testnet", process.env.REACT_APP_PV_NAME, keyPair2);
  const connectionConfig2 = {
    networkId: "testnet",
    keyStore: myKeyStore, // first create a key store
    nodeUrl: "https://rpc.testnet.near.org",
    walletUrl: "https://wallet.testnet.near.org",
    helperUrl: "https://helper.testnet.near.org",
    explorerUrl: "https://explorer.testnet.near.org",
  };
  const nearConnectionDev = await connect(connectionConfig2);

  // returns all access keys associated with an account
  const account = await nearConnectionDev.account("testdice.testnet");
  await account.getAccessKeys();

  window.walletConnectionDev = account;
  // ============================================

  // get network configuration values from config.js
  // based on the network ID we pass to getConfig()
  const nearConfig = getConfig(process.env.NEAR_ENV || "testnet");

  // create a keyStore for signing transactions using the user's key
  // which is located in the browser local storage after user logs in
  const keyStore = new nearAPI.keyStores.BrowserLocalStorageKeyStore();

  // Initializing connection to the NEAR testnet
  const near = await nearAPI.connect({ keyStore, ...nearConfig });
  // Initialize wallet connection
  const walletConnection = new nearAPI.WalletConnection(near);

  window.walletConnection = walletConnection;
  // Load in user's account data
  let currentUser;
  if (walletConnection.getAccountId()) {
    currentUser = {
      // Gets the accountId as a string
      accountId: walletConnection.getAccountId(),
      // Gets the user's token balance
      balance: (await walletConnection.account().state()).amount,
    };
  }

  // Initializing our contract APIs by contract name and configuration
  const contract = await new nearAPI.Contract(
    // User's accountId as a string
    walletConnection.account(),
    // accountId of the contract we will be loading
    // NOTE: All contracts on NEAR are deployed to an account and
    // accounts can only have one contract deployed to them.
    nearConfig.contractName,
    {
      // View methods are read-only – they don't modify the state, but usually return some value
      viewMethods: ["getMessages"],
      // Change methods can modify the state, but you don't receive the returned value when called
      changeMethods: ["addMessage"],
      // Sender is the account ID to initialize transactions.
      // getAccountId() will return empty string if user is still unauthorized
      sender: walletConnection.getAccountId(),
    }
  );

  return { contract, currentUser, nearConfig, walletConnection };
}

window.nearInitPromise = initContract().then(
  ({ contract, currentUser, nearConfig, walletConnection }) => {
    const root = ReactDOM.createRoot(document.getElementById("root"));
    root.render(
      <React.StrictMode>
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <App
                  contract={contract}
                  currentUser={currentUser}
                  nearConfig={nearConfig}
                  wallet={walletConnection}
                />
              }
            >
              ,
            </Route>
          </Routes>
        </BrowserRouter>
      </React.StrictMode>
    );
  }
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
