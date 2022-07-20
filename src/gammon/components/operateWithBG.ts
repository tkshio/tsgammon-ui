import { BoardStateNode } from 'tsgammon-core'
import { BGEventHandler } from 'tsgammon-core/dispatchers/BGEventHandler'
import { BGEventHandlersExtensible } from 'tsgammon-core/dispatchers/buildBGEventHandler'
import {
    CBAction,
    CBInPlay,
    CBResponse,
    CBToRoll,
} from 'tsgammon-core/dispatchers/CubeGameState'
import { SGInPlay, SGToRoll } from 'tsgammon-core/dispatchers/SingleGameState'
import { CBOperator } from './operators/CBOperator'
import { SGOperator } from './operators/SGOperator'

export function operateWithBG(
    autoOperators: { cb?: CBOperator; sg?: SGOperator },
    bgHandlers: BGEventHandlersExtensible
): BGEventHandler {
    const { cb, sg } = autoOperators
    if (cb === undefined || sg === undefined) {
        return bgHandlers
    }
    const autoHandler = {
        ...bgHandlers.addListeners({
            onCubeActionStarted: async (bgState: {
                cbState: CBAction
                sgState: SGToRoll
            }) => {
                const { cbState, sgState } = bgState
                const cubeAction = await Promise.resolve(
                    cb[
                        cbState.isRed
                            ? 'operateRedCubeAction'
                            : 'operateWhiteCubeAction'
                    ]
                )

                return cubeAction(
                    cbState.cubeState,
                    sgState.boardState,
                    () => {
                        autoHandler.onDouble(bgState)
                    },
                    () => {
                        setTimeout(() => autoHandler.onRoll(bgState))
                    }
                )
            },
            onCubeActionSkipped: (bgState: {
                cbState: CBToRoll
                sgState: SGToRoll
            }) => {
                setTimeout(() => autoHandler.onRoll(bgState))
            },
            onDoubled: async (bgState: {
                cbState: CBResponse
                sgState: SGToRoll
            }) => {
                const { cbState, sgState } = bgState
                const cubeResponse = await Promise.resolve(
                    cb[
                        cbState.isRed
                            ? 'operateRedCubeResponse'
                            : 'operateWhiteCubeResponse'
                    ]
                )

                return cubeResponse(
                    cbState.cubeState,
                    sgState.boardState.revert(),
                    () => {
                        autoHandler.onTake?.(bgState)
                    },
                    () => {
                        autoHandler.onPass?.(bgState)
                    }
                )
            },
            onAwaitCheckerPlay: async (bgState: {
                cbState: CBInPlay
                sgState: SGInPlay
            }) => {
                const { cbState, sgState } = bgState
                const operation = await Promise.resolve(
                    sg[
                        cbState.isRed
                            ? 'operateCheckerPlayRed'
                            : 'operateCheckerPlayWhite'
                    ]
                )

                const doCheckerPlay = (node: BoardStateNode) => {
                    autoHandler.onCommit({
                        cbState,
                        sgState: sgState.withNode(node),
                    })
                }
                return operation(doCheckerPlay, sgState.boardStateNode)
            },
        }),
    }

    return autoHandler
}
