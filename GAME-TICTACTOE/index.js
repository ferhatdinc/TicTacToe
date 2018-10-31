const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

let rooms = 0;


var player1Time=0;
var player2Time=0;

app.use(express.static('.'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'game.html'));
});

io.on('connection', (socket) => {

    // Yeni Oyun yarat
    socket.on('createGame', (data) => {
        socket.join(`room-${++rooms}`);
        socket.emit('newGame', { name: data.name, room: `room-${rooms}` });
    });

    // Oda kontrolü ve oyuna katılım
    socket.on('joinGame', function (data) {
        var room = io.nsps['/'].adapter.rooms[data.room];
        if (room && room.length === 1) {
            socket.join(data.room);
            socket.broadcast.to(data.room).emit('player1', {});
            socket.emit('player2', { name: data.name, room: data.room })
        } else {
            socket.emit('err', { message: 'Sorry, The room is full!' });
        }
    });

    socket.on('updateTimer',(data)=>{
        if(data.type=="X"){
         player1Time =data.time;
         console.log('player1 : '+player1Time);}
         else{
        player2Time =data.time;
        console.log('player2 :'+player2Time);     
         }
 
 
     });

     
    socket.on('GetResult',()=>{
        var result="";
        if(player1Time>player2Time){
            result="O Wins time difference";
        }else{
            result="X Wins time difference";
        }

        socket.emit('finalResult',{result:result});
    });

    /**
       * Oyuncu sırası
       */
    socket.on('playTurn', (data) => {
        socket.broadcast.to(data.room).emit('turnPlayed', {
            tile: data.tile,
            room: data.room
        });
    });

    /**
       *  Oyun sonu bilgileri
       */
    socket.on('gameEnded', (data) => {
        console.log("server kontrol: "+data.message);
        socket.broadcast.to(data.room).emit('gameEnd', data);
    });
});

server.listen(process.env.PORT || 5000);