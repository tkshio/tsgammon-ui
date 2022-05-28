import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GammonEngine } from 'tsgammon-core/engines/GammonEngine'
import { SingleGameEventHandlers } from '../components/eventHandlers/SingleGameEventHandlers'


export function doCheckerPlay(
    engine: GammonEngine,
    sgState: SGState,
    sgEventHandlers: SingleGameEventHandlers
) {
    switch (sgState.tag) {
        case 'SGOpening': {
            sgEventHandlers.onRollOpening(sgState)
            break
        }
        case 'SGInPlay': {
            const curNode = sgState.boardStateNode
            const nextNode = engine.checkerPlay(curNode)
            sgEventHandlers.onCommit(sgState, nextNode)
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
