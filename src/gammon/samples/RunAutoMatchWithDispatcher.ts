import { simpleNNEngine } from 'tsgammon-core/engines/SimpleNNGammon'
import { score } from 'tsgammon-core/Score'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { formatStake } from 'tsgammon-core/utils/formatStake'
import {
    setSGStateListener,
    singleGameDispatcher,
} from '../dispatchers/SingleGameDispatcher'
import { SGState } from '../dispatchers/SingleGameState'
import { toSGState } from '../dispatchers/utils/GameState'
import { doPlay } from './doPlay'
export const diceSource = randomDiceSource

function run() {
    const gState: { sg: SGState } = { sg: toSGState() }
    let gameScore = score()
    const setSGState = (state: SGState) => {
        gState.sg = state
    }

    const sgDispatcher = singleGameDispatcher(setSGStateListener(setSGState))

    let sgState = gState.sg

    while (sgState.tag !== 'SGEoG') {
        doPlay(simpleNNEngine, sgState, sgDispatcher)
        if (sgState.tag === 'SGToRoll') {
            // console.log(formatPly(sgState.lastPly))
        }
        sgState = gState.sg
    }
    // console.log(formatPly(sgState.lastState().curPly))
    gameScore = gameScore.add(sgState.stake)
    console.log(formatStake(sgState.stake, sgState.eogStatus))

    console.log(
        `Result: red ${gameScore.redScore} - white ${gameScore.whiteScore}`
    )
}

run()
