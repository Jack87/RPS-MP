var players = {
    p1 : {
        id:     "",
        name:   "Jack",
        wins:   0,
        losses: 0,
        weapon: "Fist"
    },
    p2 : {
        id:     "",
        name:   "Catalina",
        wins:   0,
        losses: 0,
        weapon: "Fist"
    },
    activeSpectators: [],
    totalConnections: 0
};
var user = {
    role: "",
    key:  ""
};
// Turns and rounds
var turn = 0;
var round = 1;
var totalRounds = 5;
// Weapons object
var weapons = {
    images: ["./assets/images/rock.png", "./assets/images/paper.png", "./assets/images/scissors.png"],
    names: ["Rock", "Paper", "Scissors"]
};
var speed = 500;
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


// Switch statment determins case to use depending on game state from DB
// gameState = 0, new game with no players
// gameState = 1, player one's turn
// gameState = 2, player two's turn
// gameState = 3, results
/* database.ref("/game").on("value", function(gameStateStatus) {
    if(gameStateStatus.child("gameState").exists()) {
      switch (gameStateStatus.val().gameState) {
        case 0:
          // new game, not programmed yet
          break;
        case 1:
          // show chatbox
          $(".chatbox").slideDown();
          // reset player choices
          resetWeaponButton();
          // enable player1 buttons
          if (user.role === "player1") {
            statusUpdate("Your turn. Shoot!");
            $(".player1 button").css("visibility", "visible");
            enableWeaponButton(user.role);
            resetFist(".player2 button img", ".player2 button");
          }
          if (user.role === "player2") {
            statusUpdate(players.p1.name+" is shooting...");
            resetFist(".player1 button img", ".player1 button");
          }
          break;
        case 2:
          if (user.role === "player1") {
            statusUpdate(players.p2.name+" is shooting...");
          }
          if (user.role === "player2") {
            // enable player2 buttons
            statusUpdate("Your turn. Choose your weapon!");
            $(".player2 button").css("visibility", "visible");
            enableWeaponButton(user.role);
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
}); */

/* ===== Connection handaling and chat. ===== */
// Chatbox live
database.ref("/chatbox").orderByChild("dateAdded").limitToLast(1).on("child_added", function(snapshot){
    var output = "<div class='msg'><span class='speaker'>";
    output += snapshot.val().name;
    output += ":</span> <span class='msgContent'>";
    output += snapshot.val().message;
    output += "</span></div>";
    $(".chatLog").append(output);
});
// Handling disconnects
// connectionsRef references a specific location in our database.
// All of our connections will be stored in this directory.
var connectionsRef = database.ref("/connections");
var connectedRef = database.ref(".info/connected");

// When the client's connection state changes...
connectedRef.on("value", function(snap) {
    // console.log("Current user role: "+user.role);
    // If they are connected..
    if (snap.val()) {
      // Add user to the connections list.
      var con = connectionsRef.push(true);
      // set local user key to connection key
      user.key = con.key;
      // Remove user from the connection list when they disconnect.
      con.onDisconnect().remove();
    }
});

// When first loaded or when the connections list changes...
connectionsRef.on("value", function(snap) {
    // Display the viewer count in the html.
    // The number of online users is the number of children in the connections list.
    $("#watchers").html("Current users: " + snap.numChildren());
});

connectionsRef.on("child_removed", function(removed) {
    // if the key of removed child matches one of the players, remove them
    if (removed.key === p1key) {
      status(players.p1.name + " disconnected!");
      // clear on db
      database.ref("/players/1").remove();
      // clear locally so new player can be added
      players.p1.name = "";
      if(user.role!=="player2") {
        $("#joinForm").show();
      }
      user.role = "";
      resetRound();
    } else if(removed.key === p2key) {
      status(players.p2.name + " disconnected!");
      database.ref("/players/2").remove();
      // clear locally so new player can be added
      players.p2.name = "";
      if(user.role!=="player1") {
        $("#joinForm").show();
      }
      user.role = "";
      resetRound();
    }
});

$(document).ready(function() {

    // Player registration
    $("#joinForm").submit(function(event){
      // don't refresh page on submit
      event.preventDefault();
      if (players.p1.name==="") {
        players.p1.name = toTitleCase($("#nameInput").val().trim());
        // set user global variable to player 1
        user.role = "player1";
  
        // write name to DOM
        $(".player1 h4").html('<i class="fas fa-user"></i> ' + players.p1.name);
        statusUpdate("Hi, "+players.p1.name+"! You're player 1. Waiting for another player to join.");
        // write player name to db
        database.ref("/players/1").update({
          key   : user.key,
          name  : players.p1.name,
          wins  : players.p1.wins,
          losses: players.p1.losses
        });
        //
        turn = 0;
        database.ref("/game").update({
          gameState: turn
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
        status("Hey, "+players.p2.name+"! You're player 2. Waiting for "+players.p1.name+" to make a move.");
        // start game by storing turn in database
        turn = 1;
        database.ref("/game").update({
          turn: turn
        });
      }
      // console.log(user.role);
    });
}); // end document ready
/* ========== Functoins ========== */
// Who won the round?
function postWinner(p1w, p2w) {
    if (p1w === p2w) {
      $(".result .card-text").html("It's a tie!");
    } else if ((p1w === "rock" && p2w === "paper") ||
               (p1w === "scissors" && p2w === "rock") ||
               (p1w === "paper" && p2w === "scissors") ){
        if (p2w === "paper") {
            $(".result .card-text").html("Paper smothers Rock " + players.p2.name + " wins!");
        } else if (p2w === "rock"){
            $(".result .card-text").html("Rock Crushes Scissors " + players.p2.name+ " wins!");
        } else {
            $(".result .card-text").html("Scissors shred Paper " + players.p2.name+ " wins!");
        }
        players.p1.losses++;
        players.p2.wins++;
    } else  {
        if (p1w === "paper") {
            $(".result .card-text").html("Paper smothers Rock " + players.p1.name + " wins!");
        } else if (p1w === "rock"){
            $(".result .card-text").html("Rock Crushes Scissors " + players.p1.name+ " wins!");
        } else {
            $(".result .card-text").html("Scissors shred Paper " + players.p1.name+ " wins!");
        }
        players.p1.wins++;
        players.p2.losses++;
    };

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

// Enable player weapon button
function enableWeaponButton(player) {
    $("." + player + " button").prop("disabled", false);
};

// Reset reset weapon buttons to initial states
function resetWeaponButton(){
    $(".fist").removeClass('active');
    $(".fist").attr("src", "./assets/images/fist.png").attr("alt", "Fist")
    // $(".fist").prop("disabled", true);
};

// Update status message
function statusUpdate(msg) {
    $(".status").html(msg);
};

/*========================================*/
function cycleWeapon() {
    document.slide.src = weapons.images[i];
    document.slide.alt = weapons.names[i];
    $(".fist").attr("data-weapon", weapons.names[i]);
    if (i < weapons.images.length - 1) {
        i++;
    } else {
        i = 0;
    }
    slideControl = setTimeout("cycleWeapon()", speed);
}
// Pause & play on hover
$('.fist').hover(function(){
    if ($(this).attr("disabled") != "disabled"){
        cycleWeapon();
    };
}, function(){
    if ($(this).attr("disabled") != "disabled"){
        document.slide.src = "./assets/images/fist.png";
        document.slide.alt = "Fist";
        $(".fist").attr("data-weapon", "Fist");
        clearTimeout(slideControl);
    };
});


$(document).on("mousedown", ".fist", function(){
    if ($(this).attr("disabled") != "disabled"){
        console.log($(this).data("weapon") + " was clicked.");
        clearTimeout(slideControl);
        var p
        var weaponChosen = $(this).data("weapon")
        if ($(this).attr('name')=="Fist1"){
            p = players.p1
        } else {
            p = players.p2
        }
        p.weapon = weaponChosen;
        console.log(p.name + "'s weapon is set to " + p.weapon + ".")
        $(this).attr("disabled", true);
    }
});