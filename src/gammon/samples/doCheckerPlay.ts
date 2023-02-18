import { GammonEngine } from 'tsgammon-core/engines/GammonEngine'
import {
    inPlayStateWithNode,
    SGState,
} from 'tsgammon-core/states/SingleGameState'
import { SingleGameEventHandler } from '../components/dispatchers/SingleGameEventHandler'

export function doCheckerPlay(
    engine: GammonEngine,
    sgState: SGState,
    sgEventHandlers: SingleGameEventHandler
) {
    switch (sgState.tag) {
        case 'SGOpening': {
            sgEventHandlers.onRollOpening(sgState)
            break
        }
        case 'SGInPlay': {
            const curNode = sgState.boardStateNode
            const nextNode = engine.checkerPlay(curNode)

            sgEventHandlers.onCommit(inPlayStateWithNode(sgState, nextNode))
            break
        }
        case 'SGToRoll': {
            sgEventHandlers.onRoll(sgState)
            break
        }
        case 'SGEoG':
            break
    }
}
