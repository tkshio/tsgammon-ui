import { BoardState, BoardStateNode, cube, CubeState } from 'tsgammon-core'
import { BGEventHandlers } from 'tsgammon-core/dispatchers/BGEventHandlers'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { BGEventHandlersExtensible } from 'tsgammon-core/dispatchers/cubefulGameEventHandlers'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { ResignOffer, RSOffered } from 'tsgammon-core/dispatchers/ResignState'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SingleGameEventHandlersExtensible } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import {
    SGInPlay,
    SGState,
    SGToRoll,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { RSOperator } from './operators/RSOperator'
import { ResignEventHandlers } from './ResignEventHandlers'

function toBoardState(sgState: SGState) {
    return {
        boardState: sgState.boardState,
        node: sgState.tag === 'SGInPlay' ? sgState.boardStateNode : undefined,
    }
}
export function w(
    rs: RSOperator | undefined,
    bgState: BGState,
    handlers: Partial<ResignEventHandlers>
): {
    concat: (
        prev: BGEventHandlersExtensible
    ) => BGEventHandlersExtensible & Partial<ResignEventHandlers>
    rsHandlers: Partial<ResignEventHandlers>
} {
    if (rs === undefined) {
        return { concat: (a) => a, rsHandlers: handlers }
    }
    const { listeners, rsHandlers } = ww(
        rs,
        handlers,
        bgState.sgState,
        bgState.cbState
    )
    return {
        concat: (prev: BGEventHandlersExtensible) => ({
            ...prev?.addListeners(listeners),
            ...rsHandlers,
        }),
        rsHandlers,
    }
}
export function wSG(
    rs: RSOperator | undefined,
    sgState: SGState,
    handlers: Partial<ResignEventHandlers>
): {
    concat: (
        prev: SingleGameEventHandlersExtensible
    ) => SingleGameEventHandlersExtensible & Partial<ResignEventHandlers>
    rsHandlers: Partial<ResignEventHandlers>
} {
    if (rs === undefined) {
        return { concat: (a) => a, rsHandlers: handlers }
    }
    const { listeners, rsHandlers } = ww(rs, handlers, sgState)
    return {
        concat: (prev: SingleGameEventHandlersExtensible) => ({
            ...prev.addListeners(listeners),
            ...rsHandlers,
        }),
        rsHandlers,
    }
}
function ww(
    rs: RSOperator,
    handlers: Partial<ResignEventHandlers>,
    sgState: SGState,
    cbState?: CBState
): {
    listeners: Partial<SingleGameListeners>
    rsHandlers: Partial<ResignEventHandlers>
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
        rsHandlers: {
            ...handlers,
            onOfferResign,
            onRejectResign,
        },
    }

    function onOfferResign(offer: ResignOffer, isRed: boolean) {
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
        }
        return undefined
    }

    function onRejectResign(resignState: RSOffered) {
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
        return undefined
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
