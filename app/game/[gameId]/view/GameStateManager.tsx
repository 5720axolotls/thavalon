"use client"
import React from 'react'
import { Game, createGame, createGameCode, getGame, getGameId, updateGamePostVote, updateGameState, updateMissionProposalVote } from '../../index';

interface Props {
    gameId: string;
  }

export const GameStateManager = ({gameId}: Props) => {
  const [username, setUsername] = React.useState<string>();
  const [game, setGame] = React.useState<Game>();
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    const name = window.localStorage.getItem("username");
    if (name) {
      setUsername(name);
    }
  }, []);

  const fetchGame = async () => {
    const game = await getGame(gameId);
    setGame(game);
    console.log("here game", game)
    setIsLoading(false);
    // here we check if we are in the voting state and all players have voted
    if (game.gameState === "VOTING") {
      const numVoted = Object.keys(game.missionToProposals[game.missionIndex][game.proposalIndex]).length;
      if (numVoted === game.players.length) {
        // updateGameState(gameId, "PROPOSING");
        const num_yes = Object.values(game.missionToProposals[game.missionIndex][game.proposalIndex]).filter(vote => vote).length;
        if (num_yes > game.players.length / 2) {
            updateGamePostVote(gameId, game.missionIndex + 1, 1);
        }
        else {
            updateGamePostVote(gameId, game.missionIndex, game.proposalIndex + 1);
        }
      }
    }
  }

  const startVote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("here starting vote")
    updateGameState(gameId, "VOTING");
  }

  const submitVote = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("here submitting vote")
    setIsLoading(true);
    if (!game || !username) {

        return;
    }
    updateMissionProposalVote(gameId, game.missionIndex, game.proposalIndex, username, e.currentTarget.vote.value === "yes");
    // updateGameState(gameId, "VOTE_SUBMITTED"); - TODO
  }

  React.useEffect(() => {
    const interval = setInterval(fetchGame, 3000);
    return () => clearInterval(interval);
  }
    , [fetchGame]);

  if (!game || !username || isLoading) {
    return <div>Loading</div>;
  }

  console.log("here missionToProposals", game.missionToProposals)
  console.log("here missionIndex", game.missionIndex, "proposals", game.missionToProposals[game.missionIndex])
  const recordedVote = game.missionToProposals[game.missionIndex][game.proposalIndex][username];
  const numVoted = Object.keys(game.missionToProposals[game.missionIndex][game.proposalIndex]).length;
  console.log("here recorded vote", recordedVote)
  let prevMissionIndex = undefined;
  let prevProposalIndex = undefined;
  if (game.missionIndex !== 1 || game.proposalIndex !== 1) {
    prevMissionIndex = game.proposalIndex === 1 ? game.missionIndex - 1 : game.missionIndex;
    // get the maximum proposal index for the previous mission
    if (game.proposalIndex === 1) {
        prevProposalIndex = Math.max(...Object.keys(game.missionToProposals[prevMissionIndex]).map(Number));
    } else {
        prevProposalIndex = game.proposalIndex - 1;
    }
  }

  
  return (<>
  <div className="w-full flex flex-col items-center justify-between">
     <p className='text-md font-bold'>Mission: {game.missionIndex} Proposal: {game.proposalIndex}</p>
   </div>
   <div className="w-full flex flex-col items-center justify-between">
   <p className='text-md font-bold'>{game.gameState}</p>
    {game.gameState === "PROPOSING" ?
     (<>
        {prevMissionIndex && prevProposalIndex && (<div>Previous Votes: 
            {Object.entries(game.missionToProposals[prevMissionIndex][prevProposalIndex]).map(([player, vote]) => 
            <p key={player}>{player}: {vote ? "Yes" : "No"}</p>)}
        </div>)}
        <form className="w-full max-w-lg flex justify-center items-center m-2" onSubmit={startVote}>
            <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" type="submit">
                Start Vote
            </button>
        </form>
     </>) :
     game.gameState === "VOTING" ?
    //  if vote has been recorded, just show that
    <>
    {recordedVote !== undefined ? <div>Vote Recorded: {recordedVote ? "Yes": "No"}</div> :
    <form className="w-full max-w-lg flex justify-center items-center m-2" onSubmit={submitVote}>
         {/* add a radio input for yes or no with each option on a different line */}
          <input type="radio" id="yes" name="vote" value="yes" />
             <label htmlFor="yes">Yes</label>
             <input type="radio" id="no" name="vote" value="no" />
             <label htmlFor="no">No</label>

        <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" type="submit">
          Submit Vote (cannot be undone!)
        </button>
      </form>}
      <p>Waiting for other players to vote ({numVoted}/{game.players.length})</p>
      </>
     : <div>Invalid Game State</div>}
     </div>
    </>
  )
}
