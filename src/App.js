import "./App.css";
import moment from "moment";
import { useEffect, useState } from "react";
import * as nearAPI from "near-api-js";
import { useNavigate } from "react-router-dom";
import { db } from "./components/firebaseConfig";
import {
  getDocs,
  collection,
  addDoc,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

function App({ contract, currentUser, nearConfig, wallet }) {
  const [recentlyData, setRecentlyData] = useState([]);
  const [BetValue, setBetValue] = useState("");
  const [PredicitonNumber, setPredicitonNumber] = useState("0");
  const [LockBet, setLockBet] = useState(false);
  const [TryAgain, setTryAgain] = useState(false);
  const [BetResult, setBetResult] = useState(false);
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const transactionHashes = params.get("transactionHashes") ?? undefined;

  const signIn = () => {
    wallet.requestSignIn(
      {
        contractId: nearConfig.contractName,
        methodNames: [contract.addMessage.name],
      }, //contract requesting access
      "NEAR Guest Book", //optional name
      null, //optional URL to redirect to if the sign in was successful
      null //optional URL to redirect to if the sign in was NOT successful
    );
  };

  const signOut = () => {
    wallet.signOut();
    window.location.replace(window.location.origin + window.location.pathname);
  };

  const randomDice = () => {
    const random = Math.floor(Math.random() * 10);

    if (random >= 1 && random <= 6) {
      rollDice(random);
    } else {
      randomDice();
    }
  };

  const rollDice = async (random) => {
    let valueResult = "";
    const dice = document.querySelector(".dice");
    const colRefget = collection(db, "diceRecentlyPlay");
    dice.style.animation = "rolling 4s";

    setTimeout(() => {
      switch (random) {
        case 1:
          dice.style.transform = "rotateX(0deg) rotateY(0deg)";
          valueResult = 1;
          break;

        case 6:
          dice.style.transform = "rotateX(180deg) rotateY(0deg)";
          valueResult = 6;
          break;

        case 2:
          dice.style.transform = "rotateX(-90deg) rotateY(0deg)";
          valueResult = 2;
          break;

        case 5:
          dice.style.transform = "rotateX(90deg) rotateY(0deg)";
          valueResult = 5;
          break;

        case 3:
          dice.style.transform = "rotateX(0deg) rotateY(90deg)";
          valueResult = 3;
          break;

        case 4:
          dice.style.transform = "rotateX(0deg) rotateY(-90deg)";
          valueResult = 4;
          break;

        default:
          break;
      }
      if (valueResult === parseInt(PredicitonNumber)) {
        setBetResult(false);
        window.walletConnectionDev.sendMoney(
          currentUser.accountId,
          nearAPI.utils.format.parseNearAmount(
            (Number(BetValue) * 5).toString()
          )
        );
        const addRecentlyWin = async (walletAddress, betValue, status) => {
          await addDoc(colRefget, {
            walletAddress: walletAddress,
            betValue: betValue,
            status: status,
            createdAt: new Date(),
          });
        };
        addRecentlyWin(
          currentUser.accountId,
          window.sessionStorage.getItem("bet"),
          "win"
        );
        getDataRecently();
      } else {
        setBetResult(true);
        const addRecentlyWin = async (walletAddress, betValue, status) => {
          await addDoc(colRefget, {
            walletAddress: walletAddress,
            betValue: betValue,
            status: status,
            createdAt: new Date(),
          });
        };
        addRecentlyWin(
          currentUser.accountId,
          window.sessionStorage.getItem("bet"),
          "lose"
        );
        getDataRecently();
      }
      setTryAgain(true);

      dice.style.animation = "none";
    }, 4050);
  };

  const sendNear = (e) => {
    if (currentUser) {
      window.walletConnection
        .account()
        .sendMoney(
          "zxccvn.testnet",
          nearAPI.utils.format.parseNearAmount(Number(BetValue).toString())
        );
    }
  };

  const getDataRecently = async (e) => {
    const colRefget = collection(db, "diceRecentlyPlay");
    const recordget = query(colRefget, orderBy("createdAt", "desc"), limit(10));
    getDocs(recordget).then((snap) => {
      console.log(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setRecentlyData(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  };

  function timeSince(date) {
    var seconds = Math.floor((new Date() - date) / 1000);
    // var seconds = Math.floor(((new Date().getTime()/1000) - date))

    var interval = seconds / 31536000;

    if (interval > 1) {
      return Math.floor(interval) + " years";
    }
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + " months";
    }
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + " days";
    }
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + " hours";
    }
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + " minutes";
    }
    return Math.floor(seconds) + " seconds";
  }

  useEffect(() => {
    // console.log(window.sessionStorage.getItem("bet"));
    if (window.sessionStorage.getItem("bet") !== "") {
      setBetValue(window.sessionStorage.getItem("bet"));
    }
  }, []);

  useEffect(() => {
    getDataRecently();
    window.sessionStorage.setItem("bet", BetValue);
    if (!transactionHashes) return;
    setLockBet(true);
  }, [transactionHashes, BetValue]);

  return (
    <div>
      <main>
        <div className="container" style={{ background: "#090745" }}>
          {currentUser ? (
            <div className="connect-wallet">
              <button
                className="connect-btn"
                onClick={() => {
                  signOut();
                }}
              >
                Disconnect
              </button>
              <span className="text-white">{currentUser.accountId}</span>
            </div>
          ) : (
            <div className="connect-wallet">
              <button
                className="connect-btn"
                onClick={() => {
                  signIn();
                }}
              >
                Connect Wallet
              </button>
            </div>
          )}
          <div className="dice">
            <div className="face front"></div>
            <div className="face back"></div>
            <div className="face top"></div>
            <div className="face bottom"></div>
            <div className="face right"></div>
            <div className="face left"></div>
          </div>
          {currentUser ? (
            <>
              {!TryAgain ? (
                <>
                  {LockBet ? (
                    <div className="text-center">
                      <h4 className="text-white">Your bet: {BetValue} Ⓝ</h4>
                      <br />
                      <button
                        className="roll"
                        onClick={() => {
                          randomDice();
                        }}
                      >
                        Roll Dice
                      </button>
                    </div>
                  ) : (
                    <>
                      <br />
                      <h6 className="text-white">I CHOOSE</h6>
                      <form style={{ textAlign: "-webkit-center" }}>
                        <div className="row" style={{ width: "100%" }}>
                          <div className="col-4">
                            <div className="btn-group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="options"
                                id="option11"
                                autocomplete="off"
                                onInput={(e) => setPredicitonNumber("1")}
                              />
                              <label
                                className="btn card text-center roll"
                                for="option11"
                                style={{ justifyContent: "center" }}
                              >
                                1
                              </label>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="btn-group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="options"
                                id="option12"
                                autocomplete="off"
                                onInput={(e) => setPredicitonNumber("2")}
                              />
                              <label
                                className="btn card text-center roll"
                                for="option12"
                                style={{ justifyContent: "center" }}
                              >
                                2
                              </label>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="btn-group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="options"
                                id="option13"
                                autocomplete="off"
                                onInput={(e) => setPredicitonNumber("3")}
                              />
                              <label
                                className="btn card text-center roll"
                                for="option13"
                                style={{ justifyContent: "center" }}
                              >
                                3
                              </label>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="btn-group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="options"
                                id="option14"
                                autocomplete="off"
                                onInput={(e) => setPredicitonNumber("4")}
                              />
                              <label
                                className="btn card text-center roll"
                                for="option14"
                                style={{ justifyContent: "center" }}
                              >
                                4
                              </label>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="btn-group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="options"
                                id="option15"
                                autocomplete="off"
                                onInput={(e) => setPredicitonNumber("5")}
                              />
                              <label
                                className="btn card text-center roll"
                                for="option15"
                                style={{ justifyContent: "center" }}
                              >
                                5
                              </label>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="btn-group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="options"
                                id="option16"
                                autocomplete="off"
                                onInput={(e) => setPredicitonNumber("6")}
                              />
                              <label
                                className="btn card text-center roll"
                                for="option16"
                                style={{ justifyContent: "center" }}
                              >
                                6
                              </label>
                            </div>
                          </div>
                        </div>
                      </form>
                      <br />
                      <form style={{ textAlign: "-webkit-center" }}>
                        <h6 className="text-white">FOR</h6>
                        <div className="row" style={{ width: "100%" }}>
                          <div className="col-4">
                            <div className="btn-group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="options"
                                id="option1"
                                autocomplete="off"
                                onInput={(e) => setBetValue("1")}
                              />
                              <label
                                className="btn card text-center roll2"
                                for="option1"
                                style={{ justifyContent: "center" }}
                              >
                                1 Ⓝ
                              </label>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="btn-group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="options"
                                id="option2"
                                autocomplete="off"
                                onInput={(e) => setBetValue("3")}
                              />
                              <label
                                className="btn card text-center roll2"
                                for="option2"
                                style={{ justifyContent: "center" }}
                              >
                                3 Ⓝ
                              </label>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="btn-group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="options"
                                id="option3"
                                autocomplete="off"
                                onInput={(e) => setBetValue("5")}
                              />
                              <label
                                className="btn card text-center roll2"
                                for="option3"
                                style={{ justifyContent: "center" }}
                              >
                                5 Ⓝ
                              </label>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="btn-group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="options"
                                id="option4"
                                autocomplete="off"
                                onInput={(e) => setBetValue("7")}
                              />
                              <label
                                className="btn card text-center roll2"
                                for="option4"
                                style={{ justifyContent: "center" }}
                              >
                                7 Ⓝ
                              </label>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="btn-group">
                              <input
                                type="radio"
                                className="btn-check"
                                name="options"
                                id="option5"
                                autocomplete="off"
                                onInput={(e) => setBetValue("10")}
                              />
                              <label
                                className="btn card text-center roll2"
                                for="option5"
                                style={{ justifyContent: "center" }}
                              >
                                10 Ⓝ
                              </label>
                            </div>
                          </div>
                        </div>
                      </form>
                      <br />
                      <span className="text-white">
                        I CHOOSE <b>{PredicitonNumber}</b> FOR{" "}
                        <b>{BetValue || "0"} Ⓝ</b>
                      </span>
                      <br />
                      <button
                        className="lock-btn"
                        onClick={() => {
                          if (BetValue !== "" && PredicitonNumber !== "") {
                            sendNear();
                          } else {
                            alert("Please insert your bet & predicition first");
                          }
                        }}
                      >
                        Lock Bet
                      </button>
                    </>
                  )}
                </>
              ) : (
                ""
              )}
              {TryAgain ? (
                <>
                  {!BetResult ? (
                    <h2 className="text-white">Congratulation!</h2>
                  ) : (
                    <h2 className="text-white">You Lose!</h2>
                  )}
                  <br />
                  <button
                    className="roll"
                    onClick={() => {
                      setBetValue("");
                      setLockBet(false);
                      setTryAgain(false);
                      navigate("/");
                    }}
                  >
                    Try Again
                  </button>
                </>
              ) : (
                ""
              )}
            </>
          ) : (
            <div className="text-white">Connect your wallet first</div>
          )}
        </div>
        <div className="last-play">
          <h5 className="text-white">RECENT PLAYS</h5>
          {/* <img style={{ width: "45vh" }} src="latest.png" /> */}
          <div className="recently-box">
            {recentlyData.map((data, index) => {
              return (
                <div key={index} className="card-box">
                  <h6 className="mx-1 mb-2">
                    <b>{data.walletAddress}</b>
                  </h6>
                  <h6 className="mx-1 mb-2">bet for</h6>
                  <h6 className="mx-1 mb-2">
                    {data.status === "lose"
                      ? data.betValue + " Ⓝ and got rugged"
                      : data.betValue + " Ⓝ" + " and doubled 5 times"}
                  </h6>
                  <code className="ms-4 mb-2">
                    {moment(data.createdAt.toDate()).fromNow()}
                  </code>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
