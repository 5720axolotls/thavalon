"use server"
import { put } from "@vercel/blob"
import { kv } from "@vercel/kv";
import { randomUUID } from "crypto";

// Game data before running script to determine start player
interface ProtoGame {
  gameId: string;
  players: string[];
}

// Game data with a specified host
interface HostedGame extends ProtoGame {
  host: string;
}

interface VoteMap {
  [player: string]: boolean | null;
}

interface ProposalToVotes {
  [index: number]: VoteMap;
}

interface MissionToProposals {
  [index: number]: ProposalToVotes;
}

// define a type of game state
export type GameState = "PROPOSING" | "VOTING";

// Game data with a specified start player
export interface Game extends ProtoGame {
  // overall game state as a string
  doNotOpen: string;
  // starting player for proposing missions
  start: string;
  // games also have a mapping from player names to their roles
  [player: string]: any;
  // current mission number tracks the current quest, 1-5
  missionIndex: number;
  // current proposal number tracks the current proposal, 1-3
  proposalIndex: number;
  // map mission/proposal indices to votes
  missionToProposals: MissionToProposals;
  // game state
  gameState: GameState;
}

export async function createGame(host: string) {
  const gameId = randomUUID();

  const game: HostedGame = { gameId, host, players: [host] }
  putGame(game)

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
        return "thavalon-five.vercel.app"
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

  const gameData: Game = await response.json()
  gameData.gameState = "PROPOSING"
  gameData.gameId = data.gameId

  putGame(gameData)
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

export async function putGame(game: ProtoGame | Game) {
  console.log("Called putGame with", game, `${game.gameId}.json`)
  const file = new Blob([JSON.stringify(game)], { type: "application/json" });
  console.log("here file", file)
  const response = await put(`${game.gameId}.json`, file, {
    access: 'public',
    addRandomSuffix: false,
    token: process.env.DB_READ_WRITE_TOKEN,
  })
  console.log("Put Response", response)
}

export async function addPlayer(gameId: string, player: string) {
  const game = await getGame(gameId)
  console.log("here adding player", game, player)
  const players = game.players || []

  if (players.includes(player)) {
    return
  }

  players.push(player)
  game.players = players

  putGame(game)
}

export async function updateGameState(gameId: string, gameState: GameState) {
  const game = await getGame(gameId)
  if (game.gameState === gameState) {
    return
  }
  game.gameState = gameState

  putGame(game)
}

export async function updateGamePostVote(gameId: string, missionIndex: number, proposalIndex: number) {
  const game = await getGame(gameId)
  console.log("Here updating mission proposal indices", missionIndex, proposalIndex)
  if ((game.missionIndex === missionIndex && game.proposalIndex === proposalIndex) || game.gameState !== "VOTING") {
    return
  }
  game.gameState = "PROPOSING"
  game.missionIndex = missionIndex
  game.proposalIndex = proposalIndex
  const missionToProposals = game.missionToProposals || {}
  missionToProposals[missionIndex] = missionToProposals[missionIndex] || {}
  missionToProposals[missionIndex][proposalIndex] =  {}
  game.missionToProposals = missionToProposals
  console.log("mission index", missionIndex, "proposals: ", proposalIndex, "here game", game)

  putGame(game)
}

export async function updateMissionProposalVote(gameId: string, missionIndex: number, proposalIndex: number, player: string, vote: boolean) {
  const game = await getGame(gameId)
  const missionToProposals = game.missionToProposals || {}
  const proposalToVotes = missionToProposals[missionIndex] || {}
  const votes = proposalToVotes[proposalIndex] || {}
  votes[player] = vote
  proposalToVotes[proposalIndex] = votes
  missionToProposals[missionIndex] = proposalToVotes
  game.missionToProposals = missionToProposals

  putGame(game)
}
