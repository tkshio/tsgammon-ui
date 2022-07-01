import {
    BoardState,
    BoardStateNode,
    cube,
    CubeState,
    EOGStatus,
} from 'tsgammon-core'
import { ResignOffer, RSOffered } from 'tsgammon-core/dispatchers/ResignState'
import { SGEventHandlerAddOn } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import {
    SGInPlay,
    SGState,
    SGToRoll,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { RSOperator } from './operators/RSOperator'
import { ResignEventHandlers } from "./ResignEventHandlers"

export function addOnWithRSAutoOperator(
    rs: RSOperator | undefined,
    handlers: ResignEventHandlers,
    cubeState: CubeState = cube(1)
): SGEventHandlerAddOn {
    if (rs === undefined) {
        return { listeners: {}, eventHandlers: {} }
    }
    const listeners = addAutoResignActions(rs, handlers, cubeState)
    return {
        listeners,
        eventHandlers: {},
    }
}
export function handlersWithRSAutoOperator(
    rs: RSOperator | undefined,
    handlers: ResignEventHandlers,
    acceptResign: (result: SGResult, eogStatus: EOGStatus) => void,
    sgState: SGState,
    cubeState: CubeState = cube(1)
): ResignEventHandlers {
    if (rs === undefined) {
        return handlers
    }
    return addAutoResignResponses(
        rs,
        handlers,
        acceptResign,
        sgState,
        cubeState
    )
}

function addAutoResignActions(
    rs: RSOperator,
    handlers: ResignEventHandlers,
    cubeState: CubeState
) {
    return {
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
    }
    function doOfferOperation(
        rs: RSOperator,
        isRed: boolean,
        lastOffer: ResignOffer | undefined,
        sgState: { boardState: BoardState; node?: BoardStateNode },
        cubeState: CubeState
    ) {
        rs[isRed ? 'operateRedOfferAction' : 'operateWhiteOfferAction'](
            (offer: ResignOffer) => handlers.onOfferResign(offer, isRed),
            lastOffer,
            cubeState,
            sgState.boardState,
            sgState.node
        )
    }
}

function addAutoResignResponses(
    rs: RSOperator,
    handlers: ResignEventHandlers,
    acceptResign: (result: SGResult, eogStatus: EOGStatus) => void,
    sgState: SGState,
    cubeState: CubeState
) {
    const onOfferResign = (offer: ResignOffer, isRed: boolean) => {
        const offered = handlers.onOfferResign(offer, isRed)
        if (offered) {
            const { boardState, node } = toBoardState(sgState)
            return rs[
                offered.isRed
                    ? 'operateRedResignResponse'
                    : 'operateWhiteResignResponse'
            ](
                offered.offer,
                () => {
                    handlers.onAcceptResign(offered, acceptResign)
                },
                () => {
                    onRejectResign(offered)
                },
                cubeState,
                boardState,
                node
            )
                ? undefined // rsOperatorが対処したなら、それ以上は何もしない
                : offered // 実際のところ、何か値を返しても特に使途はない
        }
        return undefined
    }
    const onRejectResign = (resignState: RSOffered) => {
        const rejected = handlers.onRejectResign(resignState)
        if (rejected) {
            const { boardState, node } = toBoardState(sgState)
            rs[
                rejected.isRed
                    ? 'operateRedOfferAction'
                    : 'operateWhiteOfferAction'
            ](
                (offer: ResignOffer) => {
                    onOfferResign(offer, rejected.isRed)
                },
                rejected.lastOffer,
                cubeState,
                boardState,
                node
            )
            return rejected
        }
    }
    return {
        ...handlers,
        onOfferResign,
        onRejectResign,
    }

    function toBoardState(sgState: SGState) {
        return {
            boardState: sgState.boardState,

            node:
                sgState.tag === 'SGInPlay' ? sgState.boardStateNode : undefined,
        }
    }
}
