// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB_DmzD9kkCOtswYFQy6RWaP-yN_r5uUnI",
  authDomain: "poke-battle-da0e9.firebaseapp.com",
  databaseURL: "https://poke-battle-da0e9.firebaseio.com",
  projectId: "poke-battle-da0e9",
  storageBucket: "poke-battle-da0e9.appspot.com",
  messagingSenderId: "902491672374",
  appId: "1:902491672374:web:fffb6a9f4d92d1de3f2d97"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
let playerNumber = "0";

// runs generateID for new user
function initial() {
  const playerID = localStorage.getItem("playerID");
  if (typeof playerID !== "string") {
    generateID();
  }
}
// assigns a 9 digit number to local
function generateID() {
  playerID = Math.floor(Math.random() * 900000000) + 100000000;

  localStorage.setItem("playerID", playerID);
}
$(document).ready(function() {
  database
    .ref()
    .once("value")
    .then(function(snapshot) {
      let gameRoomCount = snapshot.val().gameRoomCount;
      // database.ref(`/gameRoom${gameRoomCount}`).set({
      //   player1Entered: false,
      //   player1ID: "",
      //   player1Selected: "none",
      //   player1Wins: 0,
      //   player2Entered: false,
      //   player2ID: "",
      //   player2Selected: "none",
      //   player2Wins: 0
      // });
      database.ref().update({
        gameRoomCount
      });
    });

  initial();
  database
    .ref()
    .once("value")
    .then(function(snapshot) {
      if (snapshot.val().gameState !== "undefined") {
        // console.log(snapshot.val().gameState);
        const playerJoin = $("<div id=selectTeam></div>");
        const gen1Banner = $(
          "<h1 class=playerJoin id=selectGen1>GEN 1 STARTERS</h1>"
        )
          .append(`<img src="./assets/images/Bulbasaur.png"></img>`)
          .append(`<img src="./assets/images/Charmander.png"></img>`)
          .append(`<img src="./assets/images/Squirtle.png"></img>`);
        const gen2Banner = $(
          "<h1 class=playerJoin id=selectGen2>GEN 2 STARTERS</h1>"
        )
          .append(`<img src="./assets/images/Chikorita.png"></img>`)
          .append(`<img src="./assets/images/Cyndaquil.png"></img>`)
          .append(`<img src="./assets/images/Totodile.png"></img>`);

        playerJoin.append("<h1 id=prompt>SELECT YOUR TEAM</h1>");
        playerJoin.append(gen1Banner);
        playerJoin.append(gen2Banner);

        $("#mainContent").append(playerJoin);
      }
    });

  $("#header").append("<div id=resetButton>RESET GAME</div>");
  $(document).on("click", "#resetButton", function(event) {
    console.log("game reset");
    database.ref(`/gameRoom1`).update({
      gameReset: true
    });
  });

  function resetGame() {
    playerNumber = "0";
    genSelect();
    database.ref(`/gameRoom1`).update({
      gameReset: false,
      player1Entered: false,
      player1ID: "",
      player1Selected: "none",
      player1Wins: 0,
      player2Entered: false,
      player2ID: "",
      player2Selected: "none",
      player2Wins: 0
    });
  }
  function genSelect() {
    $("#prompt").text(`SELECT YOUR TEAM`);
    $(document).on("click", ".playerJoin", function(event) {
      database
        .ref()
        .once("value")
        .then(function(snapshot) {
          if (event.currentTarget.id === "selectGen1") {
            if (snapshot.val().gameRoom1.player1Entered === false) {
              database.ref("/gameRoom1").update({
                player1ID: localStorage.getItem("playerID"),
                player1Entered: true
              });
            }
          }
          if (event.currentTarget.id === "selectGen2") {
            if (snapshot.val().gameRoom1.player2Entered === false) {
              database.ref("/gameRoom1").update({
                player2ID: localStorage.getItem("playerID"),
                player2Entered: true
              });
            }
          }
        });
    });
  }
  database.ref().on("value", function(stateUpdate) {
    if (stateUpdate.val().gameRoom1.gameReset === true) {
      resetGame();
    } else {
      if (
        stateUpdate.val().gameRoom1["player1ID"] ===
        localStorage.getItem("playerID")
      ) {
        playerNumber = "1";
      } else if (
        stateUpdate.val().gameRoom1["player2ID"] ===
        localStorage.getItem("playerID")
      ) {
        playerNumber = "2";
      } else {
        console.log("you are not player 1 or player 2!");
      }

      if (
        stateUpdate.val().gameRoom1.player1Entered &&
        stateUpdate.val().gameRoom1.player2Entered === true
      ) {
        console.log("BOTH PLAYERS READY");
      } else {
        genSelect();
      }
      if (
        stateUpdate.val().gameRoom1[`player${playerNumber}ID`] ===
        localStorage.getItem("playerID")
      ) {
        $(document).off("click", ".playerJoin");
        $("#prompt").text(`YOU ARE PLAYER ${playerNumber}`);
        console.log(`you are player ${playerNumber}!`);
      }
    }
  });
}); // closes $(document).ready
