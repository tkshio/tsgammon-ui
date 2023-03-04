import { score } from 'tsgammon-core'
import { simpleNNEngine } from 'tsgammon-core/engines/SimpleNNGammon'
import { standardRuleSet } from 'tsgammon-core/rules/standardRuleSet'
import { sgTransition } from 'tsgammon-core/states/SGTransitions'
import {
    inPlayStateWithNode,
    SGState,
} from 'tsgammon-core/states/SingleGameState'
import { toSGState } from 'tsgammon-core/states/utils/GameSetup'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { formatStake } from 'tsgammon-core/utils/formatStake'

const diceSource = randomDiceSource
const engine = simpleNNEngine
const sg = sgTransition(standardRuleSet)
function doPlay(sgState: SGState): SGState {
    switch (sgState.tag) {
        case 'SGOpening': {
            const openingRoll = diceSource.roll()
            return sg.doOpening(sgState, openingRoll)
        }
        case 'SGInPlay': {
            const curNode = sgState.boardStateNode
            const nextNode = engine.checkerPlay(curNode)
            return sg.doCheckerPlayCommit(
                inPlayStateWithNode(sgState, nextNode)
            )
        }
        case 'SGToRoll': {
            const roll = diceSource.roll()
            return sg.doRoll(sgState, roll)
        }
        case 'SGEoG':
            return sgState
    }
}

function run() {
    let sgState = toSGState()
    let gameScore = score()
    while (sgState.tag !== 'SGEoG') {
        sgState = doPlay(sgState)
        if (sgState.tag === 'SGToRoll') {
            // console.log(formatPly(sgState.lastPly))
        }
    }
    // console.log(formatPly(sgState.lastState().curPly))
    gameScore = gameScore.add(sgState.stake)
    console.log(formatStake(sgState.stake, sgState.eogStatus))
    sgState = toSGState()

    console.log(
        `Result: red ${gameScore.redScore} - white ${gameScore.whiteScore}`
    )
}

run()
