import { BoardState, BoardStateNode, cube, CubeState } from 'tsgammon-core'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { ResignOffer, RSOffered } from 'tsgammon-core/dispatchers/ResignState'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGInPlay,
    SGState,
    SGToRoll,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { RSOperator } from './operators/RSOperator'
import { RSDialogHandlers, RSToOffer } from './RSDialogHandlers'

function toBoardState(sgState: SGState) {
    return {
        boardState: sgState.boardState,
        node: sgState.tag === 'SGInPlay' ? sgState.boardStateNode : undefined,
    }
}
export function operateWithRS(
    bgState: BGState,
    rs: RSOperator | undefined,
    rsHandlers: Partial<RSDialogHandlers>
): {
    sgListeners: Partial<SingleGameListeners>
    resignEventHandlers: Partial<RSDialogHandlers>
} {
    if (rs === undefined) {
        return {
            sgListeners: {},
            resignEventHandlers: rsHandlers,
        }
    }
    const { listeners, resignEventHandlers } = setRSOperations(
        rs,
        rsHandlers,
        bgState.sgState,
        bgState.cbState
    )
    return {
        sgListeners: listeners,
        resignEventHandlers,
    }
}

export function operateSGWithRS(
    rs: RSOperator | undefined,
    sgState: SGState,
    rsHandlers: RSDialogHandlers
): {
    sgListeners: Partial<SingleGameListeners>
    resignEventHandlers: Partial<RSDialogHandlers>
} {
    if (rs === undefined) {
        return { sgListeners: {}, resignEventHandlers: rsHandlers }
    }
    const { listeners, resignEventHandlers } = setRSOperations(
        rs,
        rsHandlers,
        sgState
    )
    return {
        sgListeners: listeners,
        resignEventHandlers,
    }
}
function setRSOperations(
    rs: RSOperator,
    handlers: Partial<RSDialogHandlers>,
    sgState: SGState,
    cbState?: CBState
): {
    listeners: Partial<SingleGameListeners>
    resignEventHandlers: Partial<RSDialogHandlers>
} {
    const cubeState = cbState?.cubeState ?? cube(1)
    return {
        listeners: {
            onAwaitRoll: (sgToRoll: SGToRoll) =>
                doOfferOperation(
                    rs,
                    sgToRoll.isRed,
                    undefined,
                    sgToRoll,
                    cubeState
                ),
            onStartCheckerPlay: (sgInPlay: SGInPlay) =>
                doOfferOperation(
                    rs,
                    sgInPlay.isRed,
                    undefined,
                    sgInPlay,
                    cubeState
                ),
        },
        resignEventHandlers: {
            ...handlers,
            onOfferResign,
            onRejectResign,
        },
    }

    function onOfferResign(
        offer: ResignOffer,
        isRed: boolean
    ): RSOffered | undefined {
        const offered = handlers.onOfferResign?.(offer, isRed)
        if (offered) {
            const { boardState, node } = toBoardState(sgState)
            ;(async () => {
                const action = await rs[
                    offered.isRed
                        ? 'operateRedResignResponse'
                        : 'operateWhiteResignResponse'
                ]

                action(
                    offered.offer,
                    () => {
                        handlers.onAcceptResign?.(offered)
                    },
                    () => {
                        onRejectResign(offered)
                    },
                    cubeState,
                    boardState,
                    node
                )
            })()
            return offered
        }
    }

    function onRejectResign(resignState: RSOffered): RSToOffer | undefined {
        const rejected = handlers.onRejectResign?.(resignState)
        if (rejected) {
            const { boardState, node } = toBoardState(sgState)
            ;(async () => {
                const action = await rs[
                    rejected.isRed
                        ? 'operateRedOfferAction'
                        : 'operateWhiteOfferAction'
                ]

                action(
                    (offer: ResignOffer) => {
                        onOfferResign(offer, rejected.isRed)
                    },
                    rejected.lastOffer,
                    cubeState,
                    boardState,
                    node
                )
            })()
            return rejected
        }
    }

    async function doOfferOperation(
        rs: RSOperator,
        isRed: boolean,
        lastOffer: ResignOffer | undefined,
        sgState: { boardState: BoardState; node?: BoardStateNode },
        cubeState: CubeState
    ) {
        const action = await rs[
            isRed ? 'operateRedOfferAction' : 'operateWhiteOfferAction'
        ]

        action(
            (offer: ResignOffer) => onOfferResign(offer, isRed),
            lastOffer,
            cubeState,
            sgState.boardState,
            sgState.node
        )
    }
}
