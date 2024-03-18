"use client"
import React from "react"
import { createGame, createGameCode, getGameId } from "./game/index";

const Lobby = () => {
  const [isInitialDelay, setIsInitialDelay] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [username, setUsername] = React.useState<string>();

  const createNewGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username) {
      alert("Please set your name first");
      return false;
    }
    setIsLoading(true);
    const gameId = await createGame(username);
    const gameCode = await createGameCode(gameId);
    console.log("game created", gameId)
    window.location.assign(`/game/${gameId}?gameCode=${gameCode}`);
    return false;
  }

  const joinGame = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username) {
      alert("Please set your name first");
      return false;
    }
    const formData = new FormData(e.currentTarget);
    const gameCode = formData.get("gameCode");
    const gameId = await getGameId(gameCode as string);
    window.location.assign(`/game/${gameId}?gameCode=${gameCode}`);
    return false;
  };

  const login = () => {
    const name = window.prompt("Enter your name");
    if (name) {
      window.localStorage.setItem("username", name);
      setUsername(name);
    }
  }

  React.useEffect(() => {
    const name = window.localStorage.getItem("username");
    if (name) {
      setUsername(name);
    }
  }
    , []);

  React.useEffect(() => {
    setTimeout(() => {
      setIsInitialDelay(false);
    }, 240);
  }, []);

  return <>
    {isInitialDelay ? <div className="h-full w-full flex items-center justify-center">
      <h1 className="text-3xl">Loading...</h1>
    </div> : null
    }
    {!isInitialDelay && !username ? <><h1 className="text-3xl mb-4">Welcome to the game lobby</h1>
      <button onClick={login} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
        Set Name
      </button>
    </> : null}
    {!isInitialDelay && username ?
      <>
        <div className="max-w-5xl w-md mb-4 font-mono text-lg flex flex-col text-center">
          <p className="text-xl mb-2">Welcome, {username}!</p>
          <button onClick={login} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Change Name
          </button>
        </div>
        <hr className="w-1/2 mb-4" />
        <form
          className="max-w-lg w-full h-full flex flex-col self-center items-center justify-center mb-6 text-lg"
          onSubmit={joinGame}
        >
          <input
            className="py-2 px-4 mb-4 text-gray-700 border-2 border-gray-300 rounded"
            type="text"
            name="gameCode"
            placeholder="Game code"
          />
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            type="submit"
          >
            Join
          </button>
        </form>
        <hr className="w-1/2 mb-4" />
        <form className="w-full max-w-lg flex justify-center items-center" onSubmit={createNewGame}>
          <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" type="submit">
            {!isLoading ? "Start New Game" : "Loading..."}
          </button>
        </form>
      </>
      : null}
  </>
}

export default Lobby
