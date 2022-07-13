import { BoardStateNode } from 'tsgammon-core'
import { BGEventHandlers } from 'tsgammon-core/dispatchers/BGEventHandlers'
import { BGEventHandlersExtensible } from 'tsgammon-core/dispatchers/cubefulGameEventHandlers'
import {
    CBAction,
    CBInPlay,
    CBResponse,
} from 'tsgammon-core/dispatchers/CubeGameState'
import { ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { SGInPlay, SGToRoll } from 'tsgammon-core/dispatchers/SingleGameState'
import { CBOperator } from '../operators/CBOperator'
import { SGOperator } from '../operators/SGOperator'
import { RSToOffer } from '../RSDialogHandlers'

export function operateForBGRS(
    resignState: ResignState | RSToOffer,
    autoOperators: { cb?: CBOperator; sg?: SGOperator },
    bgHandlers: BGEventHandlersExtensible
): BGEventHandlers {
    // 降参のシーケンスに入っている時は、BG側では何もしない
    if (resignState.tag !== 'RSNone') {
        return bgHandlers
    }
    return operateForBG(autoOperators, bgHandlers)
}

export function operateForBG(
    autoOperators: { cb?: CBOperator; sg?: SGOperator },
    bgHandlers: BGEventHandlersExtensible
): BGEventHandlers {
    const { cb, sg } = autoOperators
    if (cb === undefined || sg === undefined) {
        return bgHandlers
    }
    const autoHandler = {
        ...bgHandlers
        .addBGListeners({
            onStartCubeAction: async (bgState: {
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
                        autoHandler.onDouble?.(bgState)
                    },
                    () => {
                        autoHandler.onRoll?.(bgState)
                    }
                )
            },
            onDouble: async (bgState: {
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
