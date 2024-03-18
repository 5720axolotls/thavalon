import { getGame } from '../../index'
import React from 'react'
import { RemakeGame } from './RemakeGame'
import { GameStateManager } from './GameStateManager'

export default async function GameHome({
  params,
  searchParams
}: {
  params: { gameId: string },
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const game = await getGame(params.gameId)
  const gameCode = (searchParams['gameCode'] as string).toUpperCase()
  console.log("game here", game)

  return (
    <main className="min-h-screen h-full flex flex-col items-center justify-center p-24">
      {game &&
        <div className="max-w-5xl w-full font-mono text-sm flex flex-col">
          <div className="mb-12">
            <h1 className="text-lg">Players</h1>
          </div>
          <div className="max-w-lg w-full h-full flex flex-col self-center items-center justify-center mb-6 text-lg">
            <h2>Game Code: {gameCode}</h2>
          </div>
          <div className="max-w-lg w-full h-full flex flex-col self-center items-center justify-center">
            <div className="flex flex-row justify-center items-center w-full mb-6">
              <p className='text-md font-bold'>{game.start}</p>
            </div>
            <div className="flex flex-col justify-center items-center w-full mb-6 lg:mb-12">
              {game.players.map((player, index) => (
                <div key={index} className="flex flex-row justify-center items-center w-full mb-4">
                  <a href={`/game/${params.gameId}/view/${player}`} className="underline underline-offset-2">{player}</a>
                </div>
              ))}
            </div>
          </div>
          <GameStateManager  gameId={params.gameId}/>
          <RemakeGame/>
        </div>
      }
    </main>
  )
}