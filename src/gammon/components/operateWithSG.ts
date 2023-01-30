import { BoardStateNode } from 'tsgammon-core'
import {
    inPlayStateWithNode,
    SGInPlay,
    SGToRoll,
} from 'tsgammon-core/states/SingleGameState'
import {
    SingleGameEventHandler,
    SingleGameEventHandlerExtensible,
} from './dispatchers/SingleGameEventHandler'
import { SGOperator } from './operators/SGOperator'

export function operateWithSG(
    sg: SGOperator | undefined,
    handler: SingleGameEventHandlerExtensible
): SingleGameEventHandler {
    if (sg === undefined) {
        return handler
    }
    const autoHandler = {
        ...handler.addListeners({
            onAwaitRoll: (nextState: SGToRoll) => {
                const operation =
                    sg[nextState.isRed ? 'operateRollRed' : 'operateRollWhite']
                return setTimeout(() =>
                    operation(() => {
                        autoHandler.onRoll(nextState)
                    })
                )
            },
            onCheckerPlayStarted: async (nextState: SGInPlay) => {
                const operation = await sg[
                    nextState.isRed
                        ? 'operateCheckerPlayRed'
                        : 'operateCheckerPlayWhite'
                ]
                const doCheckerPlay = (node: BoardStateNode) => {
                    autoHandler.onCommit(inPlayStateWithNode(nextState, node))
                }
                return operation(doCheckerPlay, nextState.boardStateNode)
            },
            onOpeningCheckerPlayStarted: async (nextState: SGInPlay) => {
                const operation = await sg[
                    nextState.isRed
                        ? 'operateCheckerPlayRed'
                        : 'operateCheckerPlayWhite'
                ]
                const doCheckerPlay = (node: BoardStateNode) => {
                    autoHandler.onCommit(inPlayStateWithNode(nextState, node))
                }
                return operation(doCheckerPlay, nextState.boardStateNode)
            },
        }),
    }
    return autoHandler
}
