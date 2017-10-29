"use strict";
var userId;
var userName;
var nbQueen = 1;
var BEFOREGAME = false;
// Initialize Firebase
var config = {
    apiKey: "AIzaSyA_P-RNGkGLqqSzJvtf7mF-N3z8E4hAo8A",
    authDomain: "dualchess.firebaseapp.com",
    databaseURL: "https://dualchess.firebaseio.com",
    projectId: "dualchess",
    storageBucket: "dualchess.appspot.com",
    messagingSenderId: "155258817437"
};

firebase.initializeApp(config);
// Initializes DualChess
function DualChess(){
    // Checks that the Firebase SDK has been correctly setup and configured.
    if(!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options){
        window.alert("Firebase's SDK ERROR");
    }
    console.log("Firebase is not init");
    initFirebase();
    console.log("Firebase is init");
}


// Init Firebase
function initFirebase() {
    //START authstatelistener
    firebase.auth().onAuthStateChanged(function(user){
        if(user){

            userId = user.uid;
            userName = user.displayName;
            //USER PART show user data
            document.getElementById("user-data").style.visibility = "visible";
            document.getElementById("username").textContent = user.displayName;
            document.getElementById("profile-pic").src = user.photoURL;

            initPlayer();

            connected();
        } else{
            //If not auth
            //invite login
            notConnected();


        }
        document.getElementById("login-button").disabled = false;
    });
    // END authstatelistener
    document.getElementById("login-button").addEventListener("click", signInOut, false);
    document.getElementById("loby-button").addEventListener("click", goToLoby, false);
    document.getElementById("game-button").addEventListener("click", Cancel, false);



    new ChessGame();
}

function connected(){


    // LOGOUT BUTTON
    document.getElementById("login-button").style.backgroundColor = "#d25b46";
    document.getElementById("span-login-button").textContent = "Log out";
    // user pic right corner
    document.getElementById("sign-in-status").src = user.photoURL;

    //mechanics
    document.getElementById("user-data").style.visibility = "visible";
    document.getElementById("game").style.visibility = "visible";
    document.getElementById("history").style.visibility = "visible";
    document.getElementById("invite-log-game").style.display = "none";
    document.getElementById("invite-log-history").style.display = "none";

    //document.getElementById("accout-details").textContent = JSON.stringify(user, null, "  ");

}

function notConnected(){
    document.getElementById("login-button").style.backgroundColor = "#2ed19c";

    //hide some parts"
    document.getElementById("user-data").style.visibility = "hidden";
    document.getElementById("game").style.visibility = "hidden";
    document.getElementById("history").style.visibility = "hidden";
    //Display message login
    document.getElementById("invite-log-game").style.visibility = "visible";
    document.getElementById("invite-log-history").style.visibility = "visible";

    document.getElementById("span-login-button").textContent = "Log in";
    document.getElementById("sign-in-status").src = "../img/logout.png";
}

function inMenu(){
    //cancel button
    document.getElementById("loby-button").textContent = "Cancel Search";
    document.getElementById("spinner_loby").style.display = "block";
    document.getElementById("chessboard").style.visibility = "hidden"




}

function inLoby(){
    document.getElementById("loby-button").textContent = "Search Game";
    document.getElementById("spinner_loby").style.display = "none";
}

function inGame(){
    document.getElementById("loby-button").textContent = "Cancel Game";
    document.getElementById("chessboard").style.visibility = "visible"
    document.getElementById("spinner_loby").style.display = "none";
}

// START the sign in process
function signInOut() {

    if(firebase.auth().currentUser){
        firebase.auth().signOut();
        //notConnected();
    } else{
        var provider = new firebase.auth.GoogleAuthProvider();
        //var provider = new firebase.auth.FacebookAuthProvider();
        firebase.auth().signInWithPopup(provider);
        connected();
    }
}

function initPlayer(){

    //check if player already exists
    var ref = firebase.database().ref('/players');
    ref.once("value",function(snapshot) {
        if (snapshot.hasChild(userId)) {
            console.log("alreadycreated");
        }
        else{
            // create database
            var data = {};
            data["elo"] = 1400;
            data["nickname"] = userName;
            data["status"] = "menu";
            data["win"] = 0;
            data["loose"] = 0;       
            firebase.database().ref('/players/'+userId).update(data);
            console.log("user created");
        }
    });
}


function goToLoby(){


    //check if already in loby
    var ref = firebase.database().ref('/loby');
    ref.once("value",function(snapshot) {
        if (snapshot.hasChild(userId)) {
            console.log("already In Loby");
            snapshot.child(userId).ref.remove();
            console.log("removed from Loby");

            inLoby();
            var data_players = {};
            data_players["status"] = "menu";

        }
        else{
            // update database
            var elo = {};    
            firebase.database().ref('/players/'+userId+'/elo/').once("value", function(snapshot) {
                elo = snapshot.val();
            });

            var data_loby = {};
            data_loby["elo"] = elo;
            data_loby["status"] = "waiting";   
            firebase.database().ref('/loby/'+userId).update(data_loby);
            searchPlayer();

            var data_players = {};
            data_players["status"] = "loby";
            console.log("in loby");
            inMenu();

        }
    });
}

function searchPlayer(){
    var ref = firebase.database().ref('/loby/'+userId);
    var key = null;
    ref.once('value',function(snapshot){
        key = snapshot.key;
        console.log(key);
    }); 

    var lobyListRef =  firebase.database().ref('/loby');
    lobyListRef.once("value",function(playerListSnapchot){

        var findPlayer = false
        playerListSnapchot.forEach(function(playerSnapshot){
            console.log(playerSnapshot.key + playerSnapshot.val());
            if(playerSnapshot.key != userId && findPlayer == false){
                console.log("on lance une game")
                playerSnapshot.ref.remove();
                playerListSnapchot.child(userId).ref.remove();
                findPlayer = true;

                var data_players = {};
                data_players["status"] = "inGame";

                firebase.database().ref('/players/'+playerSnapshot.key).update(data_players);
                firebase.database().ref('/players/'+userId).update(data_players);

                Game();
                inGame();

            }
            else{
                var ref = firebase.database().ref('/players/'+userId)
                ref.on("value",function(snapchot){
                    console.log("listener");    

                    if(BEFOREGAME == false)
                    {
                        console.log(BEFOREGAME+" init");
                        BEFOREGAME = true;
                    }else{
                        Game();
                        console.log("someone found me");
                    }
                    console.log(BEFOREGAME+" ref");


                });
                console.log("alone in loby or already find oppenent");

            }
        });
    });
}

function Game(){

    inGame();
    document.getElementById("loby-button").style.display = "none";
    document.getElementById("game-button").style.display = "block";


}

function Cancel(){
    inMenu();
    var ref = firebase.database().ref('/players/'+userId);
    ref.once("value",function(snapshot) {
        var loose = snapshot.child("loose") ;
        var data = {};
        data["status"] = "menu"; 
        data["loose"] = loose + 1;       

        firebase.database().ref('/players/'+userId).update(data);   
    });
}




// Launch function DualChess when the window is loaded
window.onload = function() {
    window.dualChess = new DualChess();

};