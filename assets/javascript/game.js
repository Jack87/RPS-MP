var players = {
    p1 : {
        id:     "",
        name:   "",
        wins:   0,
        losses: 0,
        weapon: "Fist",
        key: ""
    },
    p2 : {
        id:     "",
        name:   "",
        wins:   0,
        losses: 0,
        weapon: "Fist",
        key: ""
    },
    activeSpectators: [],
    totalConnections: 0
};
var user = {
    role: "",
    key:  ""
};
// Turns and rounds
var gameState = 0;
var round = 1;
var totalRounds = 5;
// Weapons object
var weapons = {
    images: ["./assets/images/rock.png", "./assets/images/paper.png", "./assets/images/scissors.png"],
    names: ["Rock", "Paper", "Scissors"]
};
var speed = 400;
var i = 0;
var slideControl

// Initialize Firebase //
var config = {
    apiKey: "AIzaSyARzSzJkt9VHvctmktfbsuytVGb_WRPRHA",
    authDomain: "rps-test-d1aa2.firebaseapp.com",
    databaseURL: "https://rps-test-d1aa2.firebaseio.com",
    projectId: "rps-test-d1aa2",
    storageBucket: "rps-test-d1aa2.appspot.com",
    messagingSenderId: "157670266965"
  };
  firebase.initializeApp(config);
  var database = firebase.database();

//Players already playing?
database.ref("/players").on("value", function(snapshot) {
    if (snapshot.child("1/name").exists()) {
        // save to global var
        players.p1.name = snapshot.child("1/name").val();
        // render to DOM
        $(".player1 h4").html(players.p1.name);
        // save connection keys
        players.p1.key = snapshot.child("1/key").val();
    }
    if (snapshot.child("2/name").exists() && snapshot.child("1/name").exists()) {
        // save to global var
        players.p2.name = snapshot.child("2/name").val();
        // render to DOM
        $(".player2 h4").html(players.p2.name);
        // save connection keys
        players.p2.key = snapshot.child("2/key").val();
        // hide input but maintain height
        $("#joinForm").hide();
    }
});
  

// Switch statment determins case to use depending on game state from DB
// gameState = 0, new game with no players
// gameState = 1, player one's turn
// gameState = 2, player two's turn
// gameState = 3, results
database.ref("/game").on("value", function(gameStateStatus) {
    if(gameStateStatus.child("gameState").exists()) {
      switch (gameStateStatus.val().gameState) {
        case 0:
          // new game, not programmed yet
          break;
        case 1:
          // show chatbox
          $(".chatLog").slideDown();
          // reset player choices
          resetWeaponButton();
          // enable player1 buttons
          if (user.role === "player1") {
            statusUpdate("Your turn. Shoot!");
            $(".player1 button").css("visibility", "visible");
            enableWeaponButton(user.role);
            resetFist(".player2 button img", ".player2 button");
          }
          if (user.role === "player2" || user.role == "") {
            statusUpdate(players.p1.name+" is shooting...");
          }
          if (user.role === "player2") {
            resetFist(".player1 button img", ".player1 button");
          }

          break;
        case 2:
          if (user.role === "player1" || user.role == "") {
            statusUpdate(players.p2.name+" is shooting...");
          }
          if (user.role === "player2") {
            // enable player2 buttons
            statusUpdate("Your turn. Choose your weapon!");
            $(".player2 button").css("visibility", "visible");
            enableWeaponButton(user.role);
          }
          if (user.role === "") {
            showP1Choice(weapons.names.indexOf(gameStateStatus.val().p1choice));
          }
          break;
        case 3:
          // update status message
          statusUpdate("Round complete!");
          // get choices from db
          var p1choice = gameStateStatus.val().p1choice.toLowerCase();
          var p2choice = gameStateStatus.val().p2choice.toLowerCase();
          // show choices made
          $(".card button").css("visibility", "visible");
          $(".player1 ."+p1choice).addClass('active');
          $(".player2 ."+p2choice).addClass('active');
          // show winner
          postWinner(p1choice, p2choice);
          break;
      } // end switch
    }
});

// Handling Gamestate to stay sync
var gStateVal = database.ref("/game/gameState");
gStateVal.on("value", function(snapState) {
    gameState = snapState.val();
});

/* ===== Connection handaling and chat. ===== */
// Chatbox live
database.ref("/chatBox").orderByChild("dateAdded").limitToLast(1).on("child_added", function(snapshot){
    var output = "<div class='msg'><span class='speaker'>";
    output += snapshot.val().name;
    output += ":</span> <span class='msgContent'>";
    output += snapshot.val().message;
    output += "</span></div>";
    $(".chatLog").append(output);

    var logElement = document.getElementById('chatLog');
    logElement.scrollTop = logElement.scrollHeight - logElement.clientHeight;
});

// Handling disconnects
var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");

connectedRef.on("value", function(snap) {
    if (snap.val()) {
      var con = connectionsRef.push(true);
      console.log(con.onDisconnect())
      user.key = con.key;
      con.onDisconnect().remove();
    }
});

connectionsRef.on("value", function(snap) {
    $("#watchers").html("Current users: " + snap.numChildren());
});

connectionsRef.on("child_removed", function(removedKey) {
    // if the key of removed child matches one of the players, remove them
    if (removedKey.key === players.p1.key) {
        statusUpdate(players.p1.name + " disconnected!");
        database.ref("/players/1").remove();
        // clear locally so new player can be added
        players.p1.name = "";
        if(user.role!=="player2") {
            $("#joinForm").show();
            user.role = "";
        }
        resetRound();
    } else if(removedKey.key === players.p2.key) {
        statusUpdate(players.p2.name + " disconnected!");
        database.ref("/players/2").remove();
        // clear locally so new player can be added
        players.p2.name = "";
        if(user.role!=="player1") {
            $("#joinForm").show();
            user.role = "";
        }
        resetRound();
    }
});

$(document).ready(function() {
    $("#resetButton").click(function(event){
        event.preventDefault();
        database.ref().remove()
        .then(function() {
          // console.log("Reset succeeded.");
          location.reload();
        });
  
      });

    // Player registration
    $("#joinForm").submit(function(event){
      // don't refresh page on submit
      event.preventDefault();
      if (players.p1.name==="") {
        players.p1.name = toTitleCase($("#nameInput").val().trim());
        user.role = "player1";  
        $(".player1 h4").html('<i class="fas fa-user"></i> ' + players.p1.name);
        statusUpdate("Hi, "+players.p1.name+"! You're player 1. Waiting for another player to join.");
        // write to db
        database.ref("/players/1").update({
          key   : user.key,
          name  : players.p1.name,
          wins  : players.p1.wins,
          losses: players.p1.losses
        });
        gameState = 0;
        database.ref("/game").update({
            gameState: gameState
        });
        $(this).hide();
      } else if (players.p2.name===""){
        players.p2.name = toTitleCase($("#nameInput").val().trim());
        // set user global variable to player 2
        user.role = "player2";
        // write name to DOM
        $(".player2 h4").html(players.p2.name);
        // write player name to db
        database.ref("/players/2").update({
          key   : user.key,
          name  : players.p2.name,
          wins  : players.p2.wins,
          losses: players.p2.losses
        });
        statusUpdate("Hey, "+players.p2.name+"! You're player 2. Waiting for "+players.p1.name+" to make a move.");
        // start game by storing turn in database
        gameState = 1;
        database.ref("/game").update({
            gameState: gameState
        });
      }
        var scrollingElement = (document.scrollingElement || document.body);
        scrollingElement.scrollTop = scrollingElement.scrollHeight;
    });
    $(document).on("click", ".fist", function(){
        clearTimeout(slideControl);
        var elem = this;
        console.log(elem);
        setTimeout(function(){ 
            if ($(elem).attr("disabled") != "disabled"){
                console.log($(elem).data("weapon") + " was clicked.");
                clearTimeout(slideControl);
                var p
                var weaponChosen = $(elem).data("weapon")
                console.log(weaponChosen);
                if ($(elem).attr('id')=="Fist1"){
                    p = players.p1
                } else {
                    p = players.p2
                }
                p.weapon = weaponChosen;
                console.log(p.name + "'s weapon is set to " + p.weapon + ".")
                $(elem).addClass('active');
                $(elem).attr("disabled", true);
                var parent = $(elem).parent().parent();
                if (parent.hasClass("player1")) {
                    // set turn to 2 for player 2
                    gameState = 2;
                    // store values in db
                    database.ref("/game").update({
                        p1choice  : weaponChosen,
                        gameState : gameState
                    });
                    statusUpdate("Your choice is locked in. Waiting on "+players.p2.name+"...");
                } else {
                    // set turn to 3 for results
                    gameState = 3;
                    database.ref("/game").update({
                        // store values in db
                        p2choice  : weaponChosen,
                        gameState : gameState
                    });
                };

            }        
        }, 111);
    });

    $("#chatForm").submit(function(event){
        event.preventDefault();
        var message = $("#chatMessage").val().trim();
        // clear input
        $("#chatMessage").val("");
        var chatUser;
        if(user.role==="player1") {
          chatUser = players.p1.name;
        } else if (user.role==="player2") {
          chatUser = players.p2.name;
        }
        database.ref("/chatBox").push({
          name    : chatUser,
          message : message
        });
    
      });
}); // end document ready

/* ========== Functoins ========== */
// Who won the round?
function  postWinner(p1w, p2w) {
    if (p1w === p2w) {
      $(".result .card-text").html("<p class='h4 p-1'>It's a tie!</p>");
    } else if ((p1w === "rock" && p2w === "paper") ||
               (p1w === "scissors" && p2w === "rock") ||
               (p1w === "paper" && p2w === "scissors") ){
        if (p2w === "paper") {
            $(".result .card-text").html("<p class='h4 p-1'>Paper smothers Rock " + players.p2.name + " wins!</p>");
        } else if (p2w === "rock"){
            $(".result .card-text").html("<p class='h4 p-1'>Rock Crushes Scissors " + players.p2.name+ " wins!</p>");
        } else {
            $(".result .card-text").html("<p class='h4 p-1'>Scissors shred Paper " + players.p2.name+ " wins!</p>");
        }
        players.p1.losses++;
        players.p2.wins++;
    } else  {
        if (p1w === "paper") {
            $(".result .card-text").html("<p class='h4 p-1'>Paper smothers Rock " + players.p1.name + " wins!</p>");
        } else if (p1w === "rock"){
            $(".result .card-text").html("<p class='h4 p-1'>Rock Crushes Scissors " + players.p1.name+ " wins!</p>");
        } else {
            $(".result .card-text").html("<p class='h4 p-1'>Scissors shred Paper " + players.p1.name+ " wins!</p>");
        }
        players.p1.wins++;
        players.p2.losses++;
    };
    showChoices((weapons.names.indexOf(toTitleCase(p1w))), (weapons.names.indexOf(toTitleCase(p2w))));
    $("#scorePlayer1").html("Wins: "+players.p1.wins+" / Losses: "+players.p1.losses);
    $("#scorePlayer2").html("Wins: "+players.p2.wins+" / Losses: "+players.p2.losses);
    database.ref("/players/1").update({
      wins  : players.p1.wins,
      losses: players.p1.losses
    });
    database.ref("/players/2").update({
      wins  : players.p2.wins,
      losses: players.p2.losses
    });
    // after 3 seconds, reset the round
    setTimeout(resetRound, 3000);
  }

// reset and disable fist
function resetFist(wImage, wButton) {
    $(wImage).attr("src", "./assets/images/fist.png").attr("alt", "Fist")
    $(wButton).prop("disabled", true);
}

function showP1Choice(p1w) {
    document.slide1.src = weapons.images[p1w];
    document.slide1.alt = weapons.names[p1w];
}
function showChoices(p1w, p2w){
    document.slide1.src = weapons.images[p1w];
    document.slide1.alt = weapons.names[p1w];
    document.slide2.src = weapons.images[p2w];
    document.slide2.alt = weapons.names[p2w];
}

// Disable player choices
function disableChoices(player) {
    $(player).prop("disabled", true);
    $(player).siblings().prop("disabled", true);
  }

// Enable player weapon button
function enableWeaponButton(player) {
    $("." + player + " button").prop("disabled", false);
};

// Reset reset weapon buttons to initial states
function resetWeaponButton(){
    // $(".fist").removeClass('active');
    // $(".fist img").attr("src", "./assets/images/fist.png").attr("alt", "Fist")
    // $(".fist").attr("data-weapon", "Fist");
    // $(".fist").prop("disabled", true);
    $("#Fist1").removeClass('active');
    $("#Slide1").attr("src", "./assets/images/fist.png").attr("alt", "Fist");
    $("#Fist1").attr("data-weapon", "Fist");
    $("#Fist2").removeClass('active');
    $("#Slide2").attr("src", "./assets/images/fist.png").attr("alt", "Fist");
    $("#Fist2").attr("data-weapon", "Fist");
};

// Update status message
function statusUpdate(msg) {
    $(".status").html(msg);
};

//Title Case a string
function toTitleCase(str)
{
  return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
}
// Reset the round (not the entire game)
function resetRound() {
    gameState = 1;
    players.p1.weapon = "Fist"
    players.p2.weapon = "Fist"
    database.ref("/game").update({
        gameState : gameState,
        p1choice  : "",
        p2choice  : ""
    });
    resetWeaponButton();
    clearResults();
  }

// Clear results card
function clearResults() {$(".result .card-text").html("")};

/*========================================*/
function cycleWeapon() {
    if (gameState == 1 && user.role == "player1") {
        document.slide1.src = weapons.images[i];
        document.slide1.alt = weapons.names[i];
        $("#Fist1").attr("data-weapon", weapons.names[i]);
        if (i < weapons.images.length - 1) {
            i++;
        } else {
            i = 0;
        }
        slideControl = setTimeout("cycleWeapon()", speed);
    } else if (gameState == 2 && user.role == "player2") {
        document.slide2.src = weapons.images[i];
        document.slide2.alt = weapons.names[i];
        $("#Fist2").attr("data-weapon", weapons.names[i]);
        if (i < weapons.images.length - 1) {
            i++;
        } else {
            i = 0;
        }
        slideControl = setTimeout("cycleWeapon()", speed);
    }
}
// Pause & play on hover
$('.fist').hover(function(){
    if ($(this).attr("disabled") != "disabled"){
        cycleWeapon();
    };
}, function(){
    if ($(this).attr("disabled") != "disabled"){
        if (gameState == 1 && user.role == "player1") {
            document.slide1.src = "./assets/images/fist.png";
            document.slide1.alt = "Fist";
            $("#Fist1").attr("data-weapon", "Fist");
            clearTimeout(slideControl);
        } else if (gameState == 2 && user.role == "player2") {
            document.slide2.src = "./assets/images/fist.png";
            document.slide2.alt = "Fist";
            $("#Fist2").attr("data-weapon", "Fist");
            clearTimeout(slideControl);
        }
    };
    
});


