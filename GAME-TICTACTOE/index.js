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

    socket.on('createGame', (data) => {
        socket.join(`room-${++rooms}`);
        socket.emit('newGame', { name: data.name, room: `room-${rooms}` });
       
    });
    //oyuna katıl[kaç oyuncu olduğunu kontrol et]
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
     //sıra belirleme
    socket.on('playTurn', (data) => {
        socket.broadcast.to(data.room).emit('turnPlayed', {
            tile: data.tile,
            room: data.room
        });
    });
    socket.on('updateTimer1',(data)=>{
        player1Time=data.time;
        console.log('player1 : '+player1Time);
    });
    socket.on('updateTimer2',(data)=>{
        player2Time=data.time;
        console.log('player2 :'+player2Time);
    });
    socket.on('checkTime',(data)=>{
        winner="";
        if(player1Time>player2Time){
            winner="O";
        }else{winner="X";}
        socket.broadcast.to(data.room).emit('checkResult',{win:winner,p1:player1Time,p2:player2Time,data});
    })
    /**
       * Notify the players about the victor.
       */
    socket.on('gameEnded', (data) => {
        socket.broadcast.to(data.room).emit('gameEnd', data);
    });
});

server.listen(process.env.PORT || 5000);