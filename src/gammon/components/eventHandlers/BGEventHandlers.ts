import { BoardStateNode } from 'tsgammon-core'
import {
    CBAction,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll,
} from 'tsgammon-core/dispatchers/CubeGameState'
import {
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { CubeGameEventHandlers } from './CubeGameEventHandlers'
import { SingleGameEventHandlers } from './SingleGameEventHandlers'

export type BGEventHandlers = {
    onRollOpening: (bgState: { cbState: CBOpening; sgState: SGOpening }) => void

    onCommit: (
        bgState: { cbState: CBInPlay; sgState: SGInPlay },
        node: BoardStateNode
    ) => void

    onRoll: (bgState: {
        cbState: CBToRoll | CBAction
        sgState: SGToRoll
    }) => void

    onStartGame: () => void

    onDouble: (bgState: { cbState: CBAction; sgState: SGState }) => void
    onTake: (bgState: { cbState: CBResponse; sgState: SGState }) => void
    onPass: (bgState: { cbState: CBResponse; sgState: SGState }) => void
}

export function asSGEventHandlers(
    cbState: CBState,
    handlers: Partial<BGEventHandlers>
): SingleGameEventHandlers {
    return {
        onStartGame: () => {
            if (handlers.onStartGame) {
                handlers.onStartGame()
            }
        },
        onCommit: (sgState: SGInPlay, node: BoardStateNode) => {
            if (handlers.onCommit) {
                if (cbState.tag === 'CBInPlay') {
                    handlers.onCommit({ cbState, sgState }, node)
                }
            }
        },
        onRoll: (sgState: SGToRoll) => {
            if (handlers.onRoll) {
                if (cbState.tag === 'CBToRoll'|| cbState.tag === 'CBAction') {
                    handlers.onRoll({ cbState, sgState })
                }
            }
        },
        onRollOpening: (sgState: SGOpening) => {
            if (handlers.onRollOpening) {
                if (cbState.tag === 'CBOpening') {
                    handlers.onRollOpening({ cbState, sgState })
                }
            }
        },
    }
}
export function asCBEventHandlers(
    sgState: SGState,
    handlers: Partial<BGEventHandlers>
): Partial<CubeGameEventHandlers> {
    return {
        onDouble: (cbState: CBAction) => {
            if (handlers.onDouble) {
                handlers.onDouble({ cbState, sgState })
            }
        },
        onTake: (cbState: CBResponse) => {
            if (handlers.onTake) {
                handlers.onTake({ cbState, sgState })
            }
        },
        onPass: (cbState: CBResponse) => {
            if (handlers.onPass) {
                handlers.onPass({ cbState, sgState })
            }
        },
    }
}
