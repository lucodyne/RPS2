// REVIEW: Many of these comments are not necessary your code is descriptive enough
$(document).ready(function() {
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
    if (typeof playerID !== "string") { // REVIEW: I would do this in one line
      generateID();
    }
  }
  initialID();

  // assigns a 9 digit number to local, these are split
  // for reassigning an ID in case of duplicates, eventually
  function generateID() { // REVIEW: This function should be declared before it's called
                          // REVIEW: This is convention and not necessary, but easier to reason about
    playerID = Math.floor(Math.random() * 900000000) + 100000000;
    localStorage.setItem("playerID", playerID);
  }

  // game information for browser will be held here instead of everywhere
  const instance = {
    playerNumber: 0, // REVIEW: on first pass it's not clear how this is different from the next line
    playerID: localStorage.getItem("playerID"),
    playerJoin: "", // REVIEW: null is typically used for affirmatively nothing
    RPSMenu: "" // REVIEW: null is typically used for affirmatively nothing
  };

  // creates page 1
  instance.playerJoin = $("<div></div>"); // REVIEW: this should be done in the object above
  for (bannerMaker = 1; bannerMaker < 3; bannerMaker++) { // REVIEW: this may be clearer with <= 2
    const newBanner = $(
      `<h1 class=playerJoin id=selectGen${bannerMaker}>GEN ${bannerMaker} STARTERS</h1>`
    )
      .append(`<img src="./assets/images/grass${bannerMaker}.png"></img>`)
      .append(`<img src="./assets/images/fire${bannerMaker}.png"></img>`)
      .append(`<img src="./assets/images/water${bannerMaker}.png"></img>`);
    instance.playerJoin.append(newBanner);
  }

  // logic for gameRoomCount here, eventually:
  // will probably be (if 1 and 2 entered === true, and ids do not match, roomcount++)

  // reset button
  $("#header").append("<div id=resetButton>RESET GAME</div>"); // REVIEW: this is inside an h1 tag and I don't think that's right
  $(document).on("click", "#resetButton", function() {
    // only reset if a timer is not running by checking database first
    database
      .ref() // REVIEW: .ref('/gameRoom1') could be used here
      .once("value") // REVIEW: There's a potential bug here because nothing has been set in the DB at this point
      .then(function(resetSnapshot) { // REVIEW: I prefer arrow functions, especially in chains like this
        const timer = resetSnapshot.val().gameRoom1.roundTimer;
        if (timer === false) {
          database.ref(`/gameRoom1`).update({ // REVIEW: I think if we save off the ref above we can reuse it here
            gameReset: true
          });
        }
      });
  });

  // button triggers reset function for all users
  // bug: clicking reset during countdown will not stop timers
  function resetGame() { // REVIEW: This could be used to "set" the initial values guaranteeing they're the same
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
      player2Wins: 0,
      roundReset: false
    });
    $("#timer").empty();
    $(".gray").removeClass("gray");
    $("#scoreCard").empty();
  }

  // REVIEW: same potential bug here. I think these can go at the bottom
  $(document).on("click", "#goAgain", function() {
    database.ref("/gameRoom1").update({
      gameState: "rockPaperScissors",
      player1Selected: "none",
      player2Selected: "none"
    });
  });

  // adds listener to player select divs
  function genSelectListeners() {
    $("#prompt").text(`SELECT YOUR TEAM`);
    $(document).on("click", ".playerJoin", function(event) {
      database
        .ref()
        .once("value")
        .then(function(snapshot) { // REVIEW: The two blocks below are almost identical
                                   // REVIEW: A data-prop could be used to prevent replication
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

  // REVIEW: I think .ref('/gameRoom1') should be used here
  database.ref().on("value", function(stateUpdate) {
    // REVIEW: Because .val() is a method and not a static value, there may be a performance cost to call it
    // REVIEW: I would either do const stateValue = stateUpdate.val() or maybe better
    // REVIEW: const { gameReset, player1ID, player2ID, gameState, player1Entered, player2Entered } = stateUpdate.val()
    // prioritize reseting game
    if (stateUpdate.val().gameRoom1.gameReset === true) {
      resetGame(); // REVIEW: It's no necessary but adding a return here makes it more clear that you're not continuing
      // REVIEW: Also, if you return then you don't need to else and you reduce the indent depth
    }
    // else statement after reset will wrap everything
    else {
      // will check if user is already player 1 or 2, assigns to instance
      if (stateUpdate.val().gameRoom1["player1ID"] === instance.playerID) {
        instance.playerNumber = 1;
      } else if (
        stateUpdate.val().gameRoom1["player2ID"] === instance.playerID
      ) {
        instance.playerNumber = 2;
      } // REVIEW: Both of these being false may be a bug

      // phase 1: selecting a team
      if (stateUpdate.val().gameRoom1.gameState === "genSelect") {
        $("#mainContent").html(instance.playerJoin);

        // REVIEW: I think you're adding the gray class on every update which is not what you want
        if (stateUpdate.val().gameRoom1["player1Entered"] === true) {
          $("#selectGen1").addClass("gray"); // REVIEW: Class "gray" isn't semantic. Disabled might be a better name.
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
          stateUpdate.val().gameRoom1.player1Entered && // REVIEW: Be consistent with comparisons
          stateUpdate.val().gameRoom1.player2Entered === true
        ) {
          // phase 1 timer:
          if (stateUpdate.val().gameRoom1.roundTimer === false) {
            database.ref("/gameRoom1").update({
              roundTimer: true
            });
            let countDownTimer = 4;
            const startCountDown = setInterval(() => {
              countDownTimer--;
              if ((countDownTimer = 0)) {
                $("#prompt").text(`BOTH PLAYERS READY!`);
                $("#timer").text(`GAME STARTING IN ${countDownTimer}...`);
              } else { // REVIEW: I'm not sure how this doesn't break the game
                clearInterval(startCountDown);
                database.ref("/gameRoom1").update({
                  roundTimer: false,
                  gameState: "rockPaperScissors"
                });
              }
            }, 1000);
          }
        }
        // phase 2: selecting rock paper or scissors, will alternate between this and the results page until reset
      } else if (
        stateUpdate.val().gameRoom1.gameState === "rockPaperScissors"
      ) {
        // change page to rock paper scissors buttons
        // do this with a function, relies on playerid
        $("#scoreCard").empty();
        if (
          stateUpdate.val().gameRoom1.player1Selected === "none" &&
          instance.playerNumber === 1
        ) {
          $(".choseYou").removeClass("choseYou");
        }
        if (
          stateUpdate.val().gameRoom1.player2Selected === "none" &&
          instance.playerNumber === 2
        ) {
          $(".choseYou").removeClass("choseYou");
        }
        if (
          stateUpdate.val().gameRoom1[`player${instance.playerNumber}ID`] ===
          instance.playerID
        ) {
          $("#mainContent").html(instance.RPSMenu);
          if (instance.RPSMenu === "") {
            function createRPSMenu() { // REVIEW: I'm unsure why a function is used here
              instance.RPSMenu = $("<div id=RPSMenu></div>")
                .append(
                  `<img id=grass class=iChooseYou src="./assets/images/grass${instance.playerNumber}.png"></img>`
                )
                .append(
                  `<img id=fire class=iChooseYou src="./assets/images/fire${instance.playerNumber}.png"></img>`
                )
                .append(
                  `<img id=water class=iChooseYou src="./assets/images/water${instance.playerNumber}.png"></img>`
                );
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
        addPokeListeners(); // REVIEW: Again, unsure why there's a function here

        // will only call roundTimer if not already running:
        if (stateUpdate.val().gameRoom1.roundTimer === false) {
          // phase 2 timer
          database.ref("gameRoom1").update({
            roundTimer: true,
            roundReset: true,
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
        // phase 3: displays choices, round winner, score board, and timer to return to phase 2
      } else if (stateUpdate.val().gameRoom1.gameState === "results") {
        // chooses randomly if no user input
        if (instance.playerNumber === 1) {
          if (stateUpdate.val().gameRoom1.player1Selected === "none") {
            const RNG = Math.floor(Math.random() * 3 + 1);
            if (RNG === 1) { // REVIEW: Instead of this conditional I would use array
              database.ref(`/gameRoom1`).update({
                player1Selected: "grass"
              });
            } else if (RNG === 2) {
              database.ref(`/gameRoom1`).update({
                player1Selected: "fire"
              });
            } else if (RNG === 3) {
              database.ref(`/gameRoom1`).update({
                player1Selected: "water"
              });
            }
          }
        }
        if (instance.playerNumber === 2) {
          if (stateUpdate.val().gameRoom1.player2Selected === "none") {
            const RNG = Math.floor(Math.random() * 3 + 1);
            if (RNG === 1) { // REVIEW: Again, use an array
              database.ref(`/gameRoom1`).update({
                player2Selected: "grass"
              });
            } else if (RNG === 2) {
              database.ref(`/gameRoom1`).update({
                player2Selected: "fire"
              });
            } else if (RNG === 3) {
              database.ref(`/gameRoom1`).update({
                player2Selected: "water"
              });
            }
          }
        }
        $("#timer").empty();
        let { // REVIEW: This should be const
          player1Selected,
          player2Selected,
          player1Wins,
          player2Wins,
          roundReset
        } = stateUpdate.val().gameRoom1;
        if (player1Selected !== "none" && player2Selected !== "none") {
          if (instance.playerNumber === 1) { // REVIEW: These contents should be a function
            $("#mainContent").html("<div id=combatPage></div>");
            $("#combatPage")
              .append(
                `<img id=ally src="./assets/images/1${player1Selected}Back.png">`
              )
              .append(
                `<img id=enemy src="./assets/images/2${player2Selected}Front.png">`
              );
          }
          if (instance.playerNumber === 2) {
            $("#mainContent").html("<div id=combatPage></div>");
            $("#combatPage")
              .append(
                `<img id=ally src="./assets/images/2${player2Selected}Back.png">`
              )
              .append(
                `<img id=enemy src="./assets/images/1${player1Selected}Front.png">`
              );
          }
          if (player1Selected === player2Selected) {
            $("#prompt").text("TIE");
          } else {
            // checks roundReset to prevent refreshing from double incrementing
            // only winner will increment, also to prevent doubles
            function win1() {
              if (instance.playerNumber === 1) {
                if (roundReset === true) {
                  player1Wins++;
                  database.ref("/gameRoom1").update({
                    roundReset: false,
                    player1Wins: player1Wins
                  });
                }
              }
              $("#prompt").text("PLAYER 1 WINS");
            }
            function win2() {
              if (instance.playerNumber === 2) {
                if (roundReset === true) {
                  player2Wins++;
                  database.ref("/gameRoom1").update({
                    roundReset: false,
                    player2Wins: player2Wins
                  });
                }
              }
              $("#prompt").text("PLAYER 2 WINS");
            }

            if (player1Selected === "fire") {
              if (player2Selected === "water") {
                win2();
              } else {
                win1();
              }
            }
            if (player1Selected === "water") {
              if (player2Selected === "grass") {
                win2();
              } else {
                win1();
              }
            }
            if (player1Selected === "grass") {
              if (player2Selected === "fire") {
                win2();
              } else {
                win1();
              }
            }
          } // closes else after RPS tie logic
          const scoreBoard = $("<div id=scoreBoard>");
          scoreBoard.append(`<div>player1: ${player1Wins}</div>`);
          scoreBoard.append(`<div>player2: ${player2Wins}</div>`);
          scoreBoard.append("<div id=goAgain>REMATCH</div>");
          setTimeout(() => {
            $("#scoreCard").html(scoreBoard);
          }, 1000);
        }
      } // closes gamestate === results condition
    } // closes if reset else condition
  }); // closes database.ref().on("value"
}); // closes $(document).ready
