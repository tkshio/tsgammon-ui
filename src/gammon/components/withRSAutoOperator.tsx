import { BoardState, BoardStateNode, cube, CubeState } from 'tsgammon-core'
import { BGListener } from 'tsgammon-core/dispatchers/BGListener'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { BGEventHandlersExtensible } from 'tsgammon-core/dispatchers/buildBGEventHandler'
import { CBInPlay, CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { ResignOffer, RSOffered } from 'tsgammon-core/dispatchers/ResignState'
import { SingleGameListener } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGInPlay,
    SGState,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { RSOperator } from './operators/RSOperator'
import { RSDialogHandler, RSToOffer } from './RSDialogHandlers'

export function operateWithRS(
    bgState: BGState,
    rs: RSOperator | undefined,
    bgEventHandler: BGEventHandlersExtensible,
    resignEventHandler: RSDialogHandler
): {
    bgEventHandler: BGEventHandlersExtensible
    resignEventHandler: RSDialogHandler
} {
    if (rs === undefined) {
        return {
            bgEventHandler,
            resignEventHandler,
        }
    }

    const { bgListener, resignEventHandler: _resignEventHandler } =
        setRSOperations(
            rs,
            resignEventHandler,
            bgState.sgState,
            bgState.cbState
        )

    return {
        bgEventHandler: bgEventHandler.addListeners(bgListener),
        resignEventHandler: _resignEventHandler,
    }
}

export function operateSGWithRS(
    rs: RSOperator | undefined,
    sgState: SGState,
    resignEventHandler: RSDialogHandler
): {
    sgListener: Partial<SingleGameListener>
    resignEventHandler: Partial<RSDialogHandler>
} {
    if (rs === undefined) {
        return { sgListener: {}, resignEventHandler }
    }
    return setRSOperations(rs, resignEventHandler, sgState)
}

function setRSOperations(
    rs: RSOperator,
    handlers: RSDialogHandler,
    sgState: SGState,
    cbState?: CBState
): {
    bgListener: Partial<BGListener>
    sgListener: Partial<SingleGameListener>
    resignEventHandler: RSDialogHandler
} {
    const cubeState = cbState?.cubeState ?? cube(1)
    const autoHandler = handlers.withListener({
        rejectResign: (rejected: RSToOffer) => {
            const { boardState, node } = toBoardState(sgState)
            ;(async () => {
                const action = await Promise.resolve(
                    rs[
                        rejected.isRed
                            ? 'operateRedOfferAction'
                            : 'operateWhiteOfferAction'
                    ]
                )

                action(
                    (offer: ResignOffer) => {
                        autoHandler.onOfferResign(offer, rejected.isRed)
                    },
                    rejected.lastOffer,
                    cubeState,
                    boardState,
                    node
                )
            })()
        },
        offerResign: (offered: RSOffered) => {
            const { boardState, node } = toBoardState(sgState)
            ;(async () => {
                const action = await Promise.resolve(
                    rs[
                        offered.isRed
                            ? 'operateRedResignResponse'
                            : 'operateWhiteResignResponse'
                    ]
                )

                action(
                    offered.offer,
                    () => {
                        handlers.onAcceptResign?.(offered)
                    },
                    () => {
                        autoHandler.onRejectResign(offered)
                    },
                    cubeState,
                    boardState,
                    node
                )
            })()
        },
    })
    const sgListener = {
        onStartCheckerPlay: (sgInPlay: SGInPlay) =>
            doOfferOperation(autoHandler, rs, sgInPlay, cubeState),
    }
    const bgListener = {
        onAwaitCheckerPlay: (bgState: {
            cbState: CBInPlay
            sgState: SGInPlay
        }) => {
            doOfferOperation(
                autoHandler,
                rs,
                bgState.sgState,
                bgState.cbState.cubeState
            )
        },
    }

    return {
        bgListener,
        sgListener,
        resignEventHandler: autoHandler,
    }

    function toBoardState(sgState: SGState) {
        return {
            boardState: sgState.boardState,
            node:
                sgState.tag === 'SGInPlay' ? sgState.boardStateNode : undefined,
        }
    }
}

async function doOfferOperation(
    handler: RSDialogHandler,
    rs: RSOperator,
    sgState: { boardState: BoardState; node?: BoardStateNode; isRed: boolean },
    cubeState: CubeState
) {
    const isRed = sgState.isRed
    const action = await rs[
        isRed ? 'operateRedOfferAction' : 'operateWhiteOfferAction'
    ]

    action(
        (offer: ResignOffer) => handler.onOfferResign(offer, isRed),
        undefined,
        cubeState,
        sgState.boardState,
        sgState.node
    )
}
