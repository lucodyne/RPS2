// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB_DmzD9kkCOtswYFQy6RWaP-yN_r5uUnI",
  authDomain: "poke-battle-da0e9.firebaseapp.com",
  databaseURL: "https://poke-battle-da0e9.firebaseio.com",
  projectId: "poke-battle-da0e9",
  storageBucket: "",
  messagingSenderId: "902491672374",
  appId: "1:902491672374:web:fffb6a9f4d92d1de3f2d97"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

if (typeof (localStorage.getItem("playerID") !== "string")) {
  generateID();
}

function generateID() {
  playerID = Math.floor(Math.random() * 10000000000000);
  localStorage.setItem("playerID", playerID);
}
