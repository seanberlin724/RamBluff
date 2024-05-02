import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
const ENDPOINT = 'http://localhost:8080'; // Your server endpoint
const socket = io.connect(ENDPOINT);
const tableId = window.location.pathname.slice(-36);

const Seats = () => {
  const [playerData, setPlayerData] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [host, setHost] = useState(false);
  const [hasDealer, setHasDealer] = useState(false);
  const dealerRef = useRef(null);
  const [curPlayer, setPlayer] = useState(null);
  const [name, setName] = useState('');
  const [stack, setStack] = useState(0);
  const seatRef = useRef();
  const turnRef = useRef(0);
  const [inGame, setInGame] = useState(false);
  const [preRound, setPreRound] = useState(true);
  const [bet, setBet] = useState(0);
  const [update, setUpdate] = useState(0);

  useEffect(() => {
    socket.emit('joinRoom', tableId);

    socket.on('playersInRoom', (players) => {
      setPlayerData(players);
    })

    socket.on('noSeats', () => {
      alert('Table is full');
    })

    socket.on('satDown', (players) => {
      setPlayerData(players);
    })

    socket.on('setSeat', (player) => {
      let seatNum = player.seat
      seatRef.current = seatNum;
    })

    socket.on('setPlayer', (player) => {
      setPlayer(player);
    })

    socket.on('setHost', () => {
      setHost(true);
    })

    socket.on('setInGame', () => {
      setInGame(true);
    })

    socket.on('setDealer', (newDealer) => {
      setHasDealer(true);
      dealerRef.current = newDealer;
    })
    socket.on('updateDealer', (newDealer) => {
      dealerRef.current = newDealer;
    })


    socket.on('setAction', (newSeat) => {
      turnRef.current = newSeat;
      let x = update;
      setUpdate(x + 1);
    })

    socket.on('notPreRound', () => {
      setPreRound(false);
    })

    socket.on('isPreRound', () => {
      setPreRound(true);
    })

    socket.on('checkDealt21', () => {
      socket.emit('checkingDealt21', (tableId));
    })

    socket.on('playerTurnOver', () => {
      socket.emit('dealersTurn', (tableId));
    })

    socket.on('checkHand', () => {

    })

  }, [update]);

  // Function to handle "Sit Down" button click
  const handleSitDown = () => {
    if (name.trim() === '' || stack <= 0) {
      alert('Please enter valid information.');
      return;
    }
    let seat = seatRef.current;
    socket.emit('sittingDown', { name, stack, seat, tableId });
    setShowForm(false);
  };

  const handleLeaveSeat = () => {
    socket.emit('leavingSeat', curPlayer);
  };

  const handleStartGame = () => {
    socket.emit('startGame', tableId);
    setInGame(true);
  };



  const handleBetChange = (event) => {
    setBet(event.target.value);
  };

  const handleBet = () => {
    let seat = seatRef.current;
    socket.emit('playerBet', ({ tableId, seat, bet }));
  };

  const handleHit = () => {
    let seat = seatRef.current;
    socket.emit('playerHit', ({ tableId, seat }))
  
  }

  const handleStay = () => {
    let seat = seatRef.current;
    socket.emit('playerStay', ({ tableId, seat }))
  }



  return (
    <div>
      <h2>Players</h2>
      {/* Display playerData */}
      {Array.isArray(playerData) && playerData.map((item, index) => (
        <div key={index}>
          {/* Check if item is not null and render player object properties */}
          {item !== null && (
            <div>
              {item.name} ({item.stack}) {' '}
              {item.cards.length !== 0 && (
                <>
                  {item.cards.map((card, index) => (
                    <span key={index}>
                      {card}
                      {index !== item.cards.length - 1 && ' '}
                    </span>
                  ))}
                </>
              )}
              {' '}Current Bet:{' '} {item.currentBet} {' '}
              {!showForm && index === seatRef.current &&
                <button onClick={() => { setShowForm(true); handleLeaveSeat(); }}>Leave Seat</button>}
            </div>
          )}
        </div>
      ))}

      {/* Show form if not already sitting */}
      {showForm && (
        <form onSubmit={(e) => e.preventDefault()}>
          <label>
            Name:
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>
            Stack Size:
            <input type="number" value={stack} onChange={(e) => setStack(parseInt(e.target.value))} />
          </label>
          {/* Seat input removed */}
          <button onClick={handleSitDown}>Sit Down</button>
        </form>
      )}
      <div>
        {/* Show "Start Game" button for host */}
        {playerData.length >= 2 && host === true && !inGame && (
          <button onClick={handleStartGame}>Start Game</button>
        )}
      </div>
      <div>
        {turnRef.current === seatRef.current && preRound && inGame && (
          <><input type="number" value={bet} onChange={handleBetChange} /><button onClick={() => handleBet(bet)}>
            Bet
          </button></>
        )}
      </div>
      <div>
        {turnRef.current === seatRef.current && !preRound && inGame && (
          <button onClick={handleHit}> Hit </button>
        )}
        {turnRef.current === seatRef.current && !preRound && inGame && (
          <button onClick={handleStay}> Stay </button>
        )}
      </div>
      <div>
        <h2>Dealer</h2>
        {inGame && hasDealer && dealerRef.current.hand !== null && (
          <span>
            {dealerRef.current.hand.map((card, index) => (
              <span key={index}>
                {card}{' '}{dealerRef.upsideDownCard}
                {index !== dealerRef.current.hand - 1 && ' '}
              </span>
            ))}
          </span>
        )}
      </div>

    </div>

  );
};

export default Seats;