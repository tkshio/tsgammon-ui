import { useState } from 'react'
import { BoardState, BoardStateNode } from 'tsgammon-core'
import {
    ResignState,
    rsNone,
    ResignOffer,
    RSOffered,
} from 'tsgammon-core/dispatchers/ResignState'
import { SGEventHandlerAddOn } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import { SGInPlay, SGToRoll } from 'tsgammon-core/dispatchers/SingleGameState'
import { ResignStateInChoose } from './uiparts/ResignDialog'
import { RSOperator } from './operators/RSOperator'

export type MayResignOrNot =
    | { mayResign: true; isRed: boolean }
    | { mayResign: false; isRed: undefined }

export type ResignEventHandlers = {
    onCancel: () => void
    onOffer: (resignState: ResignStateInChoose, offer: ResignOffer) => void
    onReject: (resignState: RSOffered) => void
    onReset: () => void
}

const RSNONE = rsNone()
export function useResignState(
    mayResignOrNot: MayResignOrNot,
    autoOperators?: { rs?: RSOperator }
) {
    const { mayResign, isRed } = mayResignOrNot
    const [resignState, setResignState] = useState<
        ResignState | ResignStateInChoose
    >(RSNONE)

    // Resign可能な時は、ハンドラーを設定してU.I.から降参が選べるようにする
    const onResign =
        mayResign && resignState.tag === 'RSNone'
            ? () => {
                  setResignState({ tag: 'RSInChoose', isRed })
              }
            : undefined

    // 必要な状態管理機能を集約
    const resignEventHandlers: ResignEventHandlers = {
        onCancel: doReset,
        onOffer: (resignState: ResignStateInChoose, offer: ResignOffer) =>
            resignState.isRed
                ? offerFromRedToWhite(offer)
                : offerFromWhiteToRed(offer),
        onReject: (resignState: RSOffered) =>
            setResignState({
                tag: 'RSInChoose',
                isRed: !resignState.isRed,
                lastOffer: resignState.offer,
            }),
        onReset: doReset,
    }
    function doReset() {
        setResignState(RSNONE)
    }
    const { rs } = autoOperators ?? {}
    const resignStateAddOn: SGEventHandlerAddOn = rs
        ? {
              eventHandlers: {},
              listeners: {
                  onAwaitRoll: (sgToRoll: SGToRoll) =>
                      doOfferOperation(rs, sgToRoll.isRed, sgToRoll),
                  onStartCheckerPlay: (sgInPlay: SGInPlay) =>
                      doOfferOperation(rs, sgInPlay.isRed, sgInPlay),
              },
          }
        : { eventHandlers: {}, listeners: {} }

    return { resignState, onResign, resignStateAddOn, resignEventHandlers }

    function doOfferOperation(
        rs: RSOperator,
        isRed: boolean,
        sgState: { boardState: BoardState; node?: BoardStateNode }
    ) {
        isRed
            ? rs.operateRedOfferAction(
                  offerFromRedToWhite,
                  sgState.boardState,
                  sgState.node
              )
            : rs.operateWhiteOfferAction(
                  offerFromWhiteToRed,
                  sgState.boardState,
                  sgState.node
              )
    }
    function offerFromRedToWhite(offer: ResignOffer) {
        setResignState(RSNONE.doOfferResignRed(offer))
    }
    function offerFromWhiteToRed(offer: ResignOffer) {
        setResignState(RSNONE.doOfferResignWhite(offer))
    }
}
