// Make Connection
var socket = io.connect("http://localhost:4000");

var item;
var showItem = false;

// Query DOM
var username = document.getElementById('username');
var roomIn = document.getElementById('room');
var join = document.getElementById('join');
var create = document.getElementById('create');
var players = document.getElementById('players');
var itemName = document.getElementById('itemName');
var guessBtn = document.getElementById('submitGuess');
var guess = document.getElementById('guess');

// Emit events
create.addEventListener('click', function() {
    socket.emit('create', username.value);

    startBtn = document.createElement("button");
    startBtn.innerHTML = "Start Game";
    document.body.appendChild(startBtn);

    startBtn.addEventListener('click', function() {
        socket.emit('start');
        startBtn.remove();
    });
});

join.addEventListener('click', function() {
    socket.emit('join', {
        room: roomIn.value,
        username: username.value
    });
});

submitGuess.addEventListener('click', function() {
    if (guess.value > 0) {
        socket.emit('guess', guess.value);

        guess.disabled = true;
        submitGuess.disabled = true;
    }
});

// Listen for events
socket.on('join', function(data) {
    document.getElementById('welcome').remove();
    document.getElementById('roomCode').innerHTML = "Room Code: " + data;
    itemName.innerHTML = "Waiting for game to start...";
});

socket.on('start', function(data) {
    showItem = true;
    guess.disabled = false;
    submitGuess.disabled = false;
});

socket.on('update', function(data) {
    var users = data.users;
    var scores = data.scores;
    
    var playerList = "<tr><th>Name</th><th>Score</th></tr>";
    for (var i = 0; i < users.length; i++) {
        playerList += "<tr><td>" + users[i] + "</td><td>" + scores[i] + "</td><td>";
        if (!data.hasguessed[i]) {
            playerList += "<em>(Guessing)</em>";
        }
        playerList += "</td></tr>";
    }

    players.innerHTML = playerList;
});

socket.on('item', function(data) {
    item = data;
    if (showItem) {
        itemName.innerText = data;
        guess.disabled = false;
        submitGuess.disabled = false;
    }
});

socket.on('results', function(data) {
    showItem = false;

    results = document.createElement("div");
    results.innerHTML = "<h1>Guesses:</h1>";
    for (var i  =0; i < data.users.length; i++) {
        results.innerHTML += "<h2>" + data.users[i] + ": $" + data.guesses[i] + "</h2>";
    }
    results.innerHTML += "<h1>Price: $" + data.price + "</h1>";

    continueBtn = document.createElement("button");
    continueBtn.innerHTML = "Continue";
    results.appendChild(continueBtn);

    document.body.appendChild(results);

    continueBtn.addEventListener('click', function() {
        results.remove();
        itemName.innerText = item;
        guess.disabled = false;
        submitGuess.disabled = false;
        showItem = true;
    });
});