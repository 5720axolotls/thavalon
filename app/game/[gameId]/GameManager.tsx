"use client"
import React from 'react'
import { addPlayer, createGameCode, getGame, startGame } from '../index'

interface GameManagerProps {
  gameId: string;
  gameCode?: string;
}

export const GameManager = ({ gameId, gameCode }: GameManagerProps) => {
  const [player, setPlayer] = React.useState<string>("")
  const [players, setPlayers] = React.useState<string[]>([]);
  const [isHost, setIsHost] = React.useState(false);


  const removePlayer = (e: React.FormEvent, index: number) => {
    e.preventDefault();
    // TODO: Actually remove player
    // const newPlayers = players.slice();
    // newPlayers.splice(index, 1);
    // setPlayers(newPlayers);
  }

  const startNewGame = async (_: FormData) => {
    await startGame({ gameId, players });
    window.location.assign(`/game/${gameId}/view?gameCode=${gameCode}`);
  }

  React.useEffect(() => {
    const username = window.localStorage.getItem("username");
    if (username) {
      setPlayer(username);
    }
  }, []);

  const addCurrentPlayer = async () => {
    console.log("here setting player", player)
    setPlayers([...players, player]);
    await addPlayer(gameId, player);
    console.log("here fetching all players")
    await fetchPlayers();
    console.log("here done")
  }

  React.useEffect(() => {
    if (player !== "") {
      addCurrentPlayer();
    }
  }, [player]);

  const fetchPlayers = React.useCallback(async () => {
    const game = await getGame(gameId);
    console.log("here game", game)
    if (game.players !== undefined && game.players.length > 0) {
      setPlayers(game.players);
    }
    if (game.start !== undefined) {
      window.location.assign(`/game/${gameId}/view?gameCode=${gameCode}`);
    }
    if (game.host === player) {
      setIsHost(true);
    }
  }, [player, players, gameId]);

  React.useEffect(() => {
    const interval = setInterval(fetchPlayers, 7500);
    return () => clearInterval(interval);
  }
    , [fetchPlayers]);


  return (
    <main className="min-h-screen h-full flex flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full font-mono text-sm flex flex-col">
        <div className="mb-12"><h1 className='text-lg'>Players</h1></div>
        <div className="max-w-lg w-full h-full flex flex-col self-center items-center justify-center mb-6 text-lg">
          <h2>Game Code: {gameCode}</h2>
        </div>
        <form className="max-w-lg w-full h-full flex flex-col self-center items-center justify-center" action={startNewGame}>
          <div className='flex flex-col justify-center items-center w-full mb-6 lg:mb-12'>
            {players.map((player, index) => (
              <div key={index} className='flex flex-row justify-center items-center w-full'>
                <label className='mr-3'>Player {index + 1}</label>
                <p className="border-2 border-gray-300 p-2 rounded m-2 text-gray-700 bg-white w-2/5">{player}</p>
                <div className='ml-2'>
                  <button onClick={e => removePlayer(e, index)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">Remove player</button>
                </div>
              </div>
            ))}
          </div>
          {isHost ?
            <div className='w-full flex flex-col justify-center items-center lg:flex-row'>
              <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded" type="submit">
                Start
              </button>
            </div> : null}
        </form>
      </div>
    </main>
  )
}