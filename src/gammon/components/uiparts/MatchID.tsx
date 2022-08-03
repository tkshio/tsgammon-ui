import { GameState } from 'tsgammon-core/GameState'
import { MatchState } from 'tsgammon-core/MatchState'
import { toMatchID } from 'tsgammon-core/utils/toMatchID'
import './positionID.css'

export type MatchIDProps = {
    matchState: MatchState
    gameState: GameState
}
export function MatchID(props: MatchIDProps) {
    const { matchState, gameState } = props
    const { matchID } = toMatchID(matchState, gameState)
    return <div id={'matchID'}>MatchID: {matchID}</div>
}
