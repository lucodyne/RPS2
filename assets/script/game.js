// $(document).ready(function() {

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

// runs generateID for new user
function initialID() {
  const playerID = localStorage.getItem("playerID");
  if (typeof playerID !== "string") {
    generateID();
  }
}
initialID();

// assigns a 9 digit number to local, these are split
// for reassigning an ID in case of duplicates, eventually
function generateID() {
  playerID = Math.floor(Math.random() * 900000000) + 100000000;
  localStorage.setItem("playerID", playerID);
}

// game information for browser will be held here instead of everywhere
const instance = {
  playerNumber: 0,
  playerID: localStorage.getItem("playerID"),
  playerJoin: "",
  RPSMenu: "",
  playerRPSChoice: "none"
};

// creates page 1
instance.playerJoin = $("<div></div>");
for (bannerMaker = 1; bannerMaker < 3; bannerMaker++) {
  const newBanner = $(
    `<h1 class=playerJoin id=selectGen${bannerMaker}>GEN ${bannerMaker} STARTERS</h1>`
  )
    .append(`<img src="./assets/images/Grass${bannerMaker}.png"></img>`)
    .append(`<img src="./assets/images/Fire${bannerMaker}.png"></img>`)
    .append(`<img src="./assets/images/Water${bannerMaker}.png"></img>`);
  instance.playerJoin.append(newBanner);
}

// logic for gameRoomCount here, eventually:
// will probably be (if 1 and 2 entered === true, and ids do not match, roomcount++)

// reset button
$("#header").append("<div id=resetButton>RESET GAME</div>");
$(document).on("click", "#resetButton", function(event) {
  database.ref(`/gameRoom1`).update({
    gameReset: true
  });
});

// button triggers reset function for all users
// bug: clicking reset during countdown will not stop timers
function resetGame() {
  console.log("game reset");
  instance.playerNumber = 0;
  instance.RPSMenu = "";
  database.ref(`/gameRoom1`).update({
    gameReset: false,
    gameState: "genSelect",
    player1Entered: false,
    player1ID: "",
    player1Selected: "none",
    player1Wins: 0,
    player2Entered: false,
    player2ID: "",
    player2Selected: "none",
    player2Wins: 0
  });
  $("#timer").empty();
  $(".gray").removeClass("gray");
}

// adds listener to player select divs
function genSelectListeners() {
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
  // prioritize reseting game
  if (stateUpdate.val().gameRoom1.gameReset === true) {
    resetGame();
  }
  // else statement after reset will wrap everything
  else {
    // will check if user is already player 1 or 2, assigns to instance
    if (stateUpdate.val().gameRoom1["player1ID"] === instance.playerID) {
      instance.playerNumber = 1;
    } else if (stateUpdate.val().gameRoom1["player2ID"] === instance.playerID) {
      instance.playerNumber = 2;
    }

    // phase 1: selecting a team
    if (stateUpdate.val().gameRoom1.gameState === "genSelect") {
      $("#mainContent").html(instance.playerJoin);

      if (stateUpdate.val().gameRoom1["player1Entered"] === true) {
        $("#selectGen1").addClass("gray");
      }
      if (stateUpdate.val().gameRoom1["player2Entered"] === true) {
        $("#selectGen2").addClass("gray");
      }

      // if user is assigned a player already, don't load listeners
      if (
        stateUpdate.val().gameRoom1[`player${instance.playerNumber}ID`] ===
        instance.playerID
      ) {
        $(document).off("click", ".playerJoin");
        $("#prompt").text(`YOU ARE PLAYER ${instance.playerNumber}`);
      } else {
        genSelectListeners();
      }

      if (
        stateUpdate.val().gameRoom1.player1Entered &&
        stateUpdate.val().gameRoom1.player2Entered === true
      ) {
        // phase 1 timer:
        function startTimer() {
          let countDownTimer = 4;
          const startCountDown = setInterval(() => {
            countDownTimer--;
            if (countDownTimer > 0) {
              $("#prompt").text(`BOTH PLAYERS READY!`);
              $("#timer").text(`GAME STARTING IN ${countDownTimer}...`);
            } else {
              clearInterval(startCountDown);
              database.ref("/gameRoom1").update({
                gameState: "rockPaperScissors"
              });
            }
          }, 1000);
        }
        startTimer();
      }
      // phase 2: selecting rock paper or scissors, will alternate between this and the results page until reset
    } else if (stateUpdate.val().gameRoom1.gameState === "rockPaperScissors") {
      // change page to rock paper scissors buttons
      // do this with a function, relies on playerid
      if (
        stateUpdate.val().gameRoom1[`player${instance.playerNumber}ID`] ===
        instance.playerID
      ) {
        if (instance.RPSMenu === "") {
          function createRPSMenu() {
            instance.RPSMenu = $("<div id=RPSMenu></div>")
              .append(
                `<img id=grass class=iChooseYou src="./assets/images/Grass${instance.playerNumber}.png"></img>`
              )
              .append(
                `<img id=fire class=iChooseYou src="./assets/images/Fire${instance.playerNumber}.png"></img>`
              )
              .append(
                `<img id=water class=iChooseYou src="./assets/images/Water${instance.playerNumber}.png"></img>`
              );
            $("#mainContent").html(instance.RPSMenu);
          }
          createRPSMenu();
        }
      }

      // function for adding listeners to pokemon
      function addPokeListeners() {
        $(document).on("click", ".iChooseYou", function() {
          if (instance.playerNumber === 1) {
            database.ref(`/gameRoom1`).update({
              player1Selected: event.target.id
            });
          }
          if (instance.playerNumber === 2) {
            database.ref(`/gameRoom1`).update({
              player2Selected: event.target.id
            });
          }
          $(".choseYou").removeClass("choseYou");
          $(event.target).addClass("choseYou");
        });
      }
      addPokeListeners();

      // will only call roundTimer if not already running:
      if (stateUpdate.val().gameRoom1.roundTimer === false) {
        // phase 2 timer
        function roundTimer() {
          database.ref("gameRoom1").update({
            roundTimer: true,
            player1Selected: "none",
            player2Selected: "none"
          });
          $("#prompt").text("CHOOSE A POKEMON!");
          let RPSTimer = 5;
          $("#timer").text(`TIME REMAINING: ${RPSTimer}`);
          const RPSCountDown = setInterval(() => {
            $("#prompt").text("CHOOSE A POKEMON!");
            RPSTimer--;
            if (RPSTimer > 0) {
              $("#timer").text(`TIME REMAINING: ${RPSTimer}`);
            } else {
              clearInterval(RPSCountDown);
              database.ref("/gameRoom1").update({
                roundTimer: false,
                gameState: "results"
              });
            }
          }, 1000);
        }
        roundTimer();
      }
    } else if (stateUpdate.val().gameRoom1.gameState === "results") {
      console.log(`player1: ${stateUpdate.val().gameRoom1.player1Selected}`);
      console.log(`player2: ${stateUpdate.val().gameRoom1.player2Selected}`);
    }
  }
}); // closes database.ref().on("value"
// }); // closes $(document).ready
