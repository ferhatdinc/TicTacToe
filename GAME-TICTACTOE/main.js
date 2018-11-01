(function init() {
  const P1 = 'X';
  const P2 = 'O';
  let player;
  let game;
  var isTie=false;

   const socket = io.connect('https://tic-tac-toe-xo-game.herokuapp.com'),
  //const socket = io.connect('http://localhost:5000');

  /**************************************************/
  var sayac=0;
        
  function say() { 
  sayac++; 
   
  }
  
  interval=setInterval(function(){ say(); },1000);

  /***************************************************/

  class Player {
    constructor(name, type) {
      this.name = name;
      this.type = type;
      this.currentTurn = true;
      this.playsArr = 0;
      this.timer=0;
    }

    static get wins() {
      return [7, 56, 448, 73, 146, 292, 273, 84];
    }
    //Oyuncunun Bilgilerini güncelleme ve çekme işlemleri.
    updatePlaysArr(tileValue,sayacs) {
      this.playsArr += tileValue;
      this.timer+=sayacs;
      $('#sayac').html('Gecen Sure : '+this.timer+' Saniye'+'<br/>Hamle Süresi :'+sayacs+' Saniye');
    }

    getPlaysArr() {
      return this.playsArr;
    }

    // Oyuncu Sırası Güncel
    setCurrentTurn(turn) {
      this.currentTurn = turn;
      const message = turn ? 'Your turn' : 'Waiting for Opponent';
      $('#turn').text(message);
    }

    getPlayerName() {
      return this.name;
    }

    getPlayerType() {
      return this.type;
    }

    getCurrentTurn() {
      return this.currentTurn;
    }
  }

  // Oyun class
  class Game {
    constructor(roomId) {
      this.roomId = roomId;
      this.board = [];
      this.moves = 0;
    }

    // Game board yaratılıyor.
    createGameBoard() {
      function tileClickHandler() {
        const row = parseInt(this.id.split('_')[1][0], 10);
        const col = parseInt(this.id.split('_')[1][1], 10);
        if (!player.getCurrentTurn() || !game) {
          alert('Its not your turn!');
          return;
        }

        if ($(this).prop('disabled')) {
          alert('This tile has already been played on!');
          return;
        }

        // oyuncu sırası güncel.
        game.playTurn(this);
        game.updateBoard(player.getPlayerType(), row, col, this.id);

        player.setCurrentTurn(false);
        player.updatePlaysArr((1 << ((row * 3) + col)),sayac);//sayac gönderildi.

        game.checkWinner();
      }

      for (let i = 0; i < 3; i++) {
        this.board.push(['', '', '']);
        for (let j = 0; j < 3; j++) {
          $(`#button_${i}${j}`).on('click', tileClickHandler);
        }
      }
    }
    // Board ayarları güncel
    displayBoard(message) {
      $('.menu').css('display', 'none');
      $('.gameBoard').css('display', 'block');
      $('#gameInfo').css('display','block');
      $('#userHello').html(message);
      this.createGameBoard();
    }
    /**
     * Değişken açıklamaları
     *
     * @param {string} type Player tipi X veya O
     * @param {int} row Oynanan Satır değeri.
     * @param {int} col Oynanan Sütun Değeri
     * @param {string} tile Hangi buttona tıklandı.
     */
    updateBoard(type, row, col, tile) {
      $(`#${tile}`).text(type).prop('disabled', true);
      this.board[row][col] = type;
      this.moves++;
    }

    getRoomId() {
      return this.roomId;
    }

    // Tıklanan tile bilgisi gönderildi.
    playTurn(tile) {
      const clickedTile = $(tile).attr('id');

       
      socket.emit('playTurn', {
        tile: clickedTile,
        room: this.getRoomId(),
      });
    }
    /**
     *
     * Hesaplama Algoritması. Kazanan Belirlenir.
     *
     *     273                 84
     *        \               /
     *          1 |   2 |   4  = 7
     *       -----+-----+-----
     *          8 |  16 |  32  = 56
     *       -----+-----+-----
     *         64 | 128 | 256  = 448
     *       =================
     *         73   146   292
     *
     */
    checkWinner() {
      const currentPlayerPositions = player.getPlaysArr();

      console.log(player.name+'-'+player.timer);
      socket.emit('updateTimer',{time:player.timer,type:player.type});//timer update


      Player.wins.forEach((winningPosition) => {
        if ((winningPosition & currentPlayerPositions) === winningPosition) {
          game.announceWinner();
        }
      });//Buraya kadar kazanan bilgisi kontrolü
      var tieMessage;
 
  
      if (this.checkTie()) {//Beraberlik durumunda süre kontrolü

        socket.emit('GetResult');
      socket.on('finalResult',(data)=>{
        tieMessage=data.result;
        alert(tieMessage);
        socket.emit('gameEnded', {
          room: this.getRoomId(),
          message: tieMessage,
        });
        
      }); 

        location.reload();
      }
    }

    checkTie() {
      return this.moves >= 9;
    }

    //Kazanan İlanı
    announceWinner() {
      const message = `${player.getPlayerName()} wins!`;
      socket.emit('gameEnded', {
        room: this.getRoomId(),
        message,
      });
      alert(message);
      location.reload();
    }

     
    endGame(message) {
      console.log("endGame kontrol : "+message);
      alert(message);
      location.reload();
    }
  }

  // Yeni oyun yarat
  $('#new').on('click', () => {
    const name = $('#nameNew').val();
    if (!name) {
      alert('Please enter your name.');
      return;
    }
    socket.emit('createGame', { name });
    player = new Player(name, P1);
  });

  // Oyuna KAtıl
  $('#join').on('click', () => {
    const name = $('#nameJoin').val();
    const roomID = $('#room').val();
    if (!name || !roomID) {
      alert('Please enter your name and game ID.');
      return;
    }
    socket.emit('joinGame', { name, room: roomID });
    player = new Player(name, P2);
  });

  // Yeni oyun bilgileri ekrana yazdır.
  socket.on('newGame', (data) => {
    const message =
      `Hello, ${data.name}.
       <br/>Game ID: ${data.room}. 
       <br/>Waiting for player 2...`;

    // Create game for player 1
    game = new Game(data.room);
    game.displayBoard(message);
  
  });

  /**
   * Player 1 karşılama mesajı 
	 */
  socket.on('player1', (data) => {
    const message = `Hello, ${player.getPlayerName()}`;
    $('#userHello').html(message);
    player.setCurrentTurn(false);
  });

   
  socket.on('player2', (data) => {
    const message = `Hello, ${data.name}`;

    // Create game for player 2
    game = new Game(data.room);
    game.displayBoard(message);
    player.setCurrentTurn(true);
    sayac=0;
  });

  /**
	 *player 2 karşılama mesajı
	 */
  socket.on('turnPlayed', (data) => {
    const row = data.tile.split('_')[1][0];
    const col = data.tile.split('_')[1][1];
    const opponentType = player.getPlayerType() === P1 ? P2 : P1;

    game.updateBoard(opponentType, row, col, data.tile);
    player.setCurrentTurn(true);
    sayac=0;
  });

   
  socket.on('gameEnd', (data) => {
    console.log("gameend kontrol:"+data.message);//deneme
    game.endGame(data.message);
    socket.leave(data.room);
  });

  /**
	 * End the game on any err event. 
	 */
  socket.on('err', (data) => {
    game.endGame(data.message);
  });
}());
