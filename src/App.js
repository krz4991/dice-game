import "./App.css";
import { useEffect, useState } from "react";
import * as nearAPI from "near-api-js";
import { useNavigate } from "react-router-dom";
import { db } from "./components/firebaseConfig";
import { getDocs, collection, addDoc, query, orderBy, limit } from "firebase/firestore";

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
    const recordget = query(colRefget, orderBy('createdAt', 'desc'), limit(10));
    getDocs(recordget).then((snap) => {
      // console.log(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setRecentlyData(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    })
  };

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
                      <div className="row" style={{ width: "100%" }}>
                        <div className="col-4">
                          <button
                            onClick={() => {
                              setPredicitonNumber("1");
                            }}
                            className="card text-center roll"
                            style={{ padding: "1rem" }}
                          >
                            1
                          </button>
                        </div>
                        <div className="col-4">
                          <button
                            onClick={() => {
                              setPredicitonNumber("2");
                            }}
                            className="card text-center roll"
                            style={{ padding: "1rem" }}
                          >
                            2
                          </button>
                        </div>
                        <div className="col-4">
                          <button
                            onClick={() => {
                              setPredicitonNumber("3");
                            }}
                            className="card text-center roll"
                            style={{ padding: "1rem" }}
                          >
                            3
                          </button>
                        </div>
                        <div className="col-4">
                          <button
                            onClick={() => {
                              setPredicitonNumber("4");
                            }}
                            className="card text-center roll"
                            style={{ padding: "1rem" }}
                          >
                            4
                          </button>
                        </div>
                        <div className="col-4">
                          <button
                            onClick={() => {
                              setPredicitonNumber("5");
                            }}
                            className="card text-center roll"
                            style={{ padding: "1rem" }}
                          >
                            5
                          </button>
                        </div>
                        <div className="col-4">
                          <button
                            onClick={() => {
                              setPredicitonNumber("6");
                            }}
                            className="card text-center roll"
                            style={{ padding: "1rem" }}
                          >
                            6
                          </button>
                        </div>
                      </div>
                      <br />
                      <h6 className="text-white">FOR</h6>
                      <div className="row" style={{ width: "100%" }}>
                        <div className="col-4">
                          <button
                            onClick={() => {
                              setBetValue("1");
                            }}
                            className="card text-center roll"
                            style={{ padding: "1rem" }}
                          >
                            1 Ⓝ
                          </button>
                        </div>
                        <div className="col-4">
                          <button
                            onClick={() => {
                              setBetValue("3");
                            }}
                            className="card text-center roll"
                            style={{ padding: "1rem" }}
                          >
                            3 Ⓝ
                          </button>
                        </div>
                        <div className="col-4">
                          <button
                            onClick={() => {
                              setBetValue("5");
                            }}
                            className="card text-center roll"
                            style={{ padding: "1rem" }}
                          >
                            5 Ⓝ
                          </button>
                        </div>
                        <div className="col-6">
                          <button
                            onClick={() => {
                              setBetValue("7");
                            }}
                            className="card text-center roll"
                            style={{ padding: "1rem" }}
                          >
                            7 Ⓝ
                          </button>
                        </div>
                        <div className="col-6">
                          <button
                            onClick={() => {
                              setBetValue("10");
                            }}
                            className="card text-center roll"
                            style={{ padding: "1rem" }}
                          >
                            10 Ⓝ
                          </button>
                        </div>
                      </div>
                      <br />
                      <span className="text-white">
                        I CHOOSE <b>{PredicitonNumber}</b> FOR{" "}
                        <b>{BetValue || "0"} Ⓝ</b>
                      </span>
                      <br />
                      <button
                        className="roll"
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
                  <b className="mx-1 mb-2">{data.walletAddress}</b>
                  <span className="mx-1 mb-2">bet for</span>
                  <span className="mx-1 mb-2">
                    {data.status === "lose"
                      ? data.betValue + " Ⓝ and got rugged"
                      : data.betValue + " Ⓝ" + " and doubled 5 times"}
                  </span>
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
