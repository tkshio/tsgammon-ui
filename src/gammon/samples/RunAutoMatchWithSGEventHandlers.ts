import { score, standardConf } from 'tsgammon-core'
import { simpleNNEngine } from 'tsgammon-core/engines/SimpleNNGammon'
import { standardRuleSet } from 'tsgammon-core/rules/standardRuleSet'
import { defaultSGState } from 'tsgammon-core/states/defaultStates'
import { sgTransition } from 'tsgammon-core/states/SGTransitions'
import { SGState } from 'tsgammon-core/states/SingleGameState'
import { toSGState } from 'tsgammon-core/states/utils/GameSetup'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { formatStake } from 'tsgammon-core/utils/formatStake'
import { buildSGEventHandler } from '../components/dispatchers/buildSGEventHandler'
import {
    setSGStateListener,
    singleGameDispatcher,
} from '../components/dispatchers/SingleGameDispatcher'
import { doCheckerPlay } from './doCheckerPlay'

export const diceSource = randomDiceSource

function run() {
    const gState: { sg: SGState } = { sg: toSGState() }
    let gameScore = score()
    const setSGState = (state: SGState) => {
        gState.sg = state
    }
    const handlers = buildSGEventHandler(
        singleGameDispatcher(sgTransition(standardRuleSet)),
        undefined,
        setSGStateListener(defaultSGState(standardConf), setSGState)
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
