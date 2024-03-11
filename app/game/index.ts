"use server"
import { put } from "@vercel/blob"
import { kv } from "@vercel/kv";
import { randomUUID } from "crypto";

// Game data before running script to determine start player
interface ProtoGame {
  gameId: string;
  players: string[];
}

// Game data with a specified start player
export interface Game extends ProtoGame {
  // starting player for proposing missions
  start: string;
  // games also have a mapping from player names to their roles
  [player: string]: any;
}

export async function createGame(host: string) {
  const gameId = randomUUID();

  const file = new Blob([JSON.stringify({ gameId, host, players: [host] })], { type: "application/json" });
  await put(`${gameId}.json`, file, {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    token: process.env.DB_READ_WRITE_TOKEN
  })

  return gameId
}

export async function startGame(data: { gameId: string, players: string[] }) {
  const game: ProtoGame = {
    gameId: data.gameId,
    players: data.players,
  }

  const env = process.env.VERCEL_ENV || 'development'

  const origin = typeof window !== 'undefined' ? window.location.origin : (() => {
    switch (env) {
      case 'development':
        return 'localhost:3000'
      case 'preview':
        return process.env.VERCEL_BRANCH_URL
      case 'production':
        return "thavalon.vercel.app"
      default:
        throw new Error('Unknown environment')
    }
  })()

  const url = origin?.includes('localhost') ? `http://${origin}` : `https://${origin}`

  const response = await fetch(
    `${url}/api/game`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(game),
    }
  )

  const gameData = await response.json()

  const file = new Blob([JSON.stringify(gameData)], { type: "application/json" });
  await put(`${data.gameId}.json`, file, {
    access: 'public',
    addRandomSuffix: false,
    token: process.env.DB_READ_WRITE_TOKEN
  })
}

export async function getGame(gameId: string): Promise<Game> {
  const response = await fetch(
    `https://spwamd4ap0dqqd0y.public.blob.vercel-storage.com/${gameId}.json?timestamp=${Date.now()}`,
    {
      headers: {
        "content-type": "application/json",
      },
    }
  )
  const gameData = await response.json()
  return gameData
}

export async function createGameCode(gameId: string) {
  const code = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"
  const gameCode = code.split('').sort(() => Math.random() - 0.5).slice(0, 4).join('')

  kv.set(gameCode, gameId)

  return gameCode
}

export async function getGameId(gameCode: string) {
  const gameId = await kv.get(gameCode.toUpperCase())

  return gameId
}

export async function addPlayer(gameId: string, player: string) {
  const game = await getGame(gameId)
  const players = game.players || []

  if (players.includes(player)) {
    return
  }

  players.push(player)
  game.players = players

  const file = new Blob([JSON.stringify(game)], { type: "application/json" });
  await put(`${gameId}.json`, file, {
    access: 'public',
    addRandomSuffix: false,
    token: process.env.DB_READ_WRITE_TOKEN,
  })
}
