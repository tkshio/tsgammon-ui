import { BoardState, BoardStateNode, cube, CubeState } from 'tsgammon-core'
import { ResignOffer } from 'tsgammon-core/ResignOffer'
import { BGState } from 'tsgammon-core/states/BGState'
import { CBInPlay, CBState } from 'tsgammon-core/states/CubeGameState'
import { ResignState, RSOffered } from 'tsgammon-core/states/ResignState'
import { SGInPlay, SGState } from 'tsgammon-core/states/SingleGameState'
import { BGEventHandler } from './dispatchers/BGEventHandler'
import { BGListener } from './dispatchers/BGListener'
import { BGEventHandlersExtensible } from './dispatchers/buildBGEventHandler'
import { ResignEventHandler } from './dispatchers/ResignEventHandlers'
import {
    SingleGameEventHandler,
    SingleGameEventHandlerExtensible,
} from './dispatchers/SingleGameEventHandler'
import { SingleGameListener } from './dispatchers/SingleGameListener'
import { operateWithBG } from './operateWithBG'
import { operateWithSG } from './operateWithSG'
import { CBOperator } from './operators/CBOperator'
import { RSOperator } from './operators/RSOperator'
import { SGOperator } from './operators/SGOperator'
import { RSDialogHandler, RSToOffer } from './RSDialogHandler'

export function operateWithBGandRS(
    resignState: ResignState | RSToOffer,
    bgState: BGState,
    autoOperators: { cb?: CBOperator; sg?: SGOperator; rs?: RSOperator },
    bgHandler: BGEventHandlersExtensible,
    rsHandler: RSDialogHandler
): { bgEventHandler: BGEventHandler; rsDialogHandler: ResignEventHandler } {
    const { bgListener, rsDialogHandler } = operateWithRS(
        bgState,
        autoOperators.rs,
        rsHandler
    )

    // 降参のシーケンスに入っている時は、BG側では何もしない
    if (resignState.tag !== 'RSNone') {
        return {
            bgEventHandler: bgHandler.addListener(bgListener),
            rsDialogHandler,
        }
    }

    return {
        bgEventHandler: operateWithBG(
            autoOperators,
            bgHandler.addListener(bgListener)
        ),
        rsDialogHandler,
    }
}

export function operateWithRS(
    bgState: BGState,
    rs: RSOperator | undefined,
    rsDialogHandler: RSDialogHandler
): {
    bgListener: Partial<BGListener>
    rsDialogHandler: RSDialogHandler
} {
    if (rs === undefined) {
        return {
            bgListener: {},
            rsDialogHandler,
        }
    }

    const { bgListener, rsDialogHandler: _resignEventHandler } =
        setRSOperations(rs, rsDialogHandler, bgState.sgState, bgState.cbState)

    return {
        bgListener,
        rsDialogHandler: _resignEventHandler,
    }
}

export function operateWithSGandRS(
    autoOperators: { rs?: RSOperator; sg?: SGOperator },
    sgState: SGState,
    rsHandler: RSDialogHandler,
    sgHandler: SingleGameEventHandlerExtensible
): {
    sgHandler: SingleGameEventHandler
    rsDialogHandler: Partial<RSDialogHandler>
} {
    const { sg, rs } = autoOperators
    if (rs === undefined) {
        return {
            sgHandler: operateWithSG(sg, sgHandler),
            rsDialogHandler: rsHandler,
        }
    }
    const { sgListener, rsDialogHandler } = setRSOperations(
        rs,
        rsHandler,
        sgState
    )

    return {
        sgHandler: operateWithSG(sg, sgHandler.addListeners(sgListener)),
        rsDialogHandler,
    }
}

function setRSOperations(
    rs: RSOperator,
    handler: RSDialogHandler,
    sgState: SGState,
    cbState?: CBState
): {
    bgListener: Partial<BGListener>
    sgListener: Partial<SingleGameListener>
    rsDialogHandler: RSDialogHandler
} {
    const cubeState = cbState?.cubeState ?? cube(1)
    const rsDialogHandler = handler.withListener({
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
                        rsDialogHandler.onOfferResign(offer, rejected.isRed)
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
                        handler.onAcceptResign?.(offered)
                    },
                    () => {
                        rsDialogHandler.onRejectResign(offered)
                    },
                    cubeState,
                    boardState,
                    node
                )
            })()
        },
    })
    const sgListener = {
        onCheckerPlayStarted: (sgInPlay: SGInPlay) =>
            doOfferOperation(rsDialogHandler, rs, sgInPlay, cubeState),
    }
    const bgListener = {
        onAwaitCheckerPlay: (bgState: {
            cbState: CBInPlay
            sgState: SGInPlay
        }) => {
            doOfferOperation(
                rsDialogHandler,
                rs,
                bgState.sgState,
                bgState.cbState.cubeState
            )
        },
    }

    return {
        bgListener,
        sgListener,
        rsDialogHandler: rsDialogHandler,
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
