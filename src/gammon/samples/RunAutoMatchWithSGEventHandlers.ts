import { standardConf } from 'tsgammon-core'
import {
    SGState
} from 'tsgammon-core/dispatchers/SingleGameState'
import { toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { simpleNNEngine } from 'tsgammon-core/engines/SimpleNNGammon'
import { score } from 'tsgammon-core/Score'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { formatStake } from 'tsgammon-core/utils/formatStake'
import { defaultSGState } from '../components/defaultStates'
import { buildSGEventHandlers } from '../components/eventHandlers/SingleGameEventHandlers'
import { doCheckerPlay } from './doCheckerPlay'


export const diceSource = randomDiceSource

function run() {
    const gState: { sg: SGState } = { sg: toSGState() }
    let gameScore = score()
    const setSGState = (state: SGState) => {
        gState.sg = state
    }
    const { handlers } = buildSGEventHandlers(
        defaultSGState(standardConf),
        setSGState,
    )

    let sgState = gState.sg

    while (sgState.tag !== 'SGEoG') {
        doCheckerPlay(simpleNNEngine, sgState, handlers)
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
