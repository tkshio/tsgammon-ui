import { BoardStateNode } from 'tsgammon-core'
import { BGEventHandler } from 'tsgammon-core/dispatchers/BGEventHandler'
import { BGEventHandlersExtensible } from 'tsgammon-core/dispatchers/buildBGEventHandler'
import {
    CBAction,
    CBInPlay,
    CBResponse,
    CBToRoll,
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
): BGEventHandler {
    // 降参のシーケンスに入っている時は、BG側では何もしない
    if (resignState.tag !== 'RSNone') {
        return bgHandlers
    }
    return operateForBG(autoOperators, bgHandlers)
}

export function operateForBG(
    autoOperators: { cb?: CBOperator; sg?: SGOperator },
    bgHandlers: BGEventHandlersExtensible
): BGEventHandler {
    const { cb, sg } = autoOperators
    if (cb === undefined || sg === undefined) {
        return bgHandlers
    }
    const autoHandler = {
        ...bgHandlers
        .addListeners({
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
                        autoHandler.onDouble(bgState)
                    },
                    () => {
                        autoHandler.onRoll(bgState)
                    }
                )
            },
            onSkipCubeAction: (bgState:{
                cbState:CBToRoll,sgState:SGToRoll
            })=>{
                // ダイスロール自体が非同期的に実行されるので、同期的に操作する
                autoHandler.onRoll(bgState)
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
