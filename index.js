var express = require('express');
var socket = require('socket.io');
var crypto = require('crypto');
const { SocketAddress } = require('net');
var eBay = require('ebay-node-api');
var eBay = new eBay({
    clientID: "-- Client APP ID --",
    env: "SANDBOX"
});
var fs = require('fs');
const { info } = require('console');

var words = fs.readFileSync('./words.txt').toString();
words = words.split("\n");

// App setup
var app = express();
var server = app.listen(4000, function(){
    console.log("Listening to requests on port 4000");
});

// Static files
app.use(express.static('public'));

// Socket setup
var io = socket(server);

// Web app
var rooms = {};

function randomWord() {
    return words[Math.floor(Math.random() * words.length)];
}

function getItem(room) {
    eBay.findItemsByKeywords({
        keywords: randomWord(),
        sortOrder: 'StartTimeNewest',
        limit: 1
    }).then((data) => {
        if (data[0].searchResult[0]['@count'] == 0) {
            console.log("Nothing found, looking again");
            getItem(room);
            return;
        }
        var item = data[0].searchResult[0].item[0];
        var info = {
            name: item.title[0],
            price: parseFloat(item.sellingStatus[0].currentPrice[0].__value__)
        };
        rooms[room].item = info;
        io.in(room).emit('item', info.name);
    }, (error) => {
        console.log(error);
        getItem(room);
    });
}

async function updateRoom(room) {
    const sockets = await io.in(room).fetchSockets();
    var users = [], scores = [], hasguessed = new Array(sockets.length), guesses = [];
    
    for (var i=0; i<sockets.length; i++) {
        users.push(sockets[i].data.username);
        scores.push(sockets[i].data.score);

        if (sockets[i].data.guess !== null) {
            guesses.push(sockets[i].data.guess);
            hasguessed[i]  = true;
        }
    }

    if (guesses.length == sockets.length) {
        var best = [];
        var minDiff = 1.7976931348623157e+308;
        var price = rooms[room].item.price;

        for (var i=0; i<sockets.length; i++) {
            var guess = sockets[i].data.guess;
            if (guess == price) {
                sockets[i].data.score += 3;
                scores[i] += 3;
                best = [];
                minDiff = 0;
            }
            else if (guess < price) {
                if (price-guess == minDiff) {
                    best.push(i);
                }
                else if (price-guess < minDiff) {
                    best = [i];
                    minDiff = price-guess;
                }
            }
        }

        best.forEach(function(i) {
            sockets[i].data.score += 1;
            scores[i] += 1;
        });

        // New Item
        for (var i=0; i<sockets.length; i++) {
            sockets[i].data.guess = null;
        }
        hasguessed = new Array(sockets.length);

        io.in(room).emit('results', {
            users: users,   
            guesses: guesses,
            price: price
        });

        getItem(room);
    }

    io.in(room).emit('update', {
        users: users,
        scores: scores,
        hasguessed: hasguessed
    });
}

function joinRoom(socket, room, username) {
    socket.join(room);
    socket.data = {
        username: username,
        score: 0,
        guess: null
    }
    socket.emit('join', room);
    updateRoom(room);
    if (rooms[room].started) {
        socket.emit('start', null);
        socket.emit('item', rooms[room].item.name);
    }
}

// Websocket
io.on('connection', function(socket) {
    console.log("Made socket connection ", socket.id);
    var gameRoom = null;

    socket.on('disconnect', function(socket) {
        if (gameRoom !== null) {
            updateRoom(gameRoom);
        }
    });

    socket.on('create', function(data) {
        // Generate random room code
        gameRoom = crypto.randomBytes(3).toString('hex');

        rooms[gameRoom] = {item: null, started: false};
        getItem(gameRoom);
        joinRoom(socket, gameRoom, data);
    });

    socket.on('join', function(data) {
        if (io.sockets.adapter.rooms.has(data.room)) {
            gameRoom = data.room;
            joinRoom(socket, data.room, data.username);
        }
    });

    socket.on('guess', function(data) {
        socket.data.guess = data;
        updateRoom(gameRoom);
    });

    socket.on('start', function() {
        rooms[gameRoom].started = true;
        io.in(gameRoom).emit('start', null);
        if (rooms[gameRoom].item !== null) {
            io.in(gameRoom).emit('item', rooms[gameRoom].item.name);
        }
    });
});