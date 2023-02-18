import { score, standardConf } from 'tsgammon-core'
import { simpleNNEngine } from 'tsgammon-core/engines/SimpleNNGammon'
import { standardRuleSet } from 'tsgammon-core/rules/standardRuleSet'
import { BGState } from 'tsgammon-core/states/BGState'
import { defaultBGState } from 'tsgammon-core/states/defaultStates'
import { sgTransition } from 'tsgammon-core/states/SGTransitions'
import { toCBState, toSGState } from 'tsgammon-core/states/utils/GameSetup'
import { formatStake } from 'tsgammon-core/utils/formatStake'
import {
    asSGEventHandler,
    BGEventHandler,
    setBGStateListener,
} from '../components/dispatchers/BGEventHandler'
import { buildBGEventHandler } from '../components/dispatchers/buildBGEventHandler'
import { rollListener } from '../components/dispatchers/RollDispatcher'
import { singleGameDispatcher } from '../components/dispatchers/SingleGameDispatcher'
import { doCheckerPlay } from './doCheckerPlay'

const engine = simpleNNEngine

function doPlay(bgState: BGState, eventHandlers: BGEventHandler) {
    const { cbState, sgState } = bgState
    switch (cbState.tag) {
        case 'CBOpening':
        case 'CBInPlay':
        case 'CBToRoll':
            doCheckerPlay(
                simpleNNEngine,
                sgState,
                asSGEventHandler(cbState, eventHandlers)
            )
            break

        case 'CBAction':
            if (sgState.tag === 'SGToRoll') {
                if (
                    engine.cubeAction(sgState.boardState, cbState.cubeState)
                        .isDouble
                ) {
                    eventHandlers.onDouble({ cbState, sgState })
                } else {
                    eventHandlers.onRoll({ cbState, sgState })
                }
            } else {
                throw new Error(
                    'Unexpected sgState for cube action: sgState=' + sgState.tag
                )
            }
            break

        case 'CBResponse':
            if (sgState.tag === 'SGToRoll') {
                if (
                    engine.cubeResponse(sgState.boardState, cbState.cubeState)
                        .isTake
                ) {
                    eventHandlers.onTake({ cbState, sgState })
                } else {
                    eventHandlers.onPass({ cbState, sgState })
                }
            } else {
                throw new Error(
                    'Unexpected sgState for cube response: sgState=' +
                        sgState.tag
                )
            }
            break

        case 'CBEoG':
            break
    }
}
function run() {
    const gameConf = { ...standardConf, jacobyRule: false }
    let gameScore = score()
    const gState = { cb: toCBState(), sg: toSGState() }

    const setBGState = (state: BGState) => {
        gState.cb = state.cbState
        gState.sg = state.sgState
    }
    const handlers = buildBGEventHandler(
        singleGameDispatcher(sgTransition(standardRuleSet)),
        () => false,
        rollListener(),
        setBGStateListener(defaultBGState(gameConf), setBGState)
    )

    let cbState = gState.cb
    let sgState = gState.sg

    while (cbState.tag !== 'CBEoG') {
        doPlay({ cbState, sgState }, handlers)

        cbState = gState.cb
        sgState = gState.sg
    }

    const stake = cbState.calcStake(gameConf).stake
    gameScore = gameScore.add(stake)
    console.log(formatStake(stake, cbState.eogStatus))

    console.log(
        `Result: red ${gameScore.redScore} - white ${gameScore.whiteScore}`
    )
}
run()
