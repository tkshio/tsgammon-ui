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
    onResign?: () => void
    onCancelResign: () => void
    onOfferResign: (
        resignState: ResignStateInChoose,
        offer: ResignOffer
    ) => void
    onRejectResign: (resignState: RSOffered) => void
    onResetResign: () => void
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

    // 必要な状態管理機能を集約
    const resignEventHandlers: ResignEventHandlers = {
        onCancelResign: doReset,
        onOfferResign: (resignState: ResignStateInChoose, offer: ResignOffer) =>
            resignState.isRed
                ? offerFromRedToWhite(offer)
                : offerFromWhiteToRed(offer),
        onRejectResign: (resignState: RSOffered) =>
            setResignState({
                tag: 'RSInChoose',
                isRed: !resignState.isRed,
                lastOffer: resignState.offer,
            }),
        onResetResign: doReset,
        onResign:
            mayResign && resignState.tag === 'RSNone'
                ? () => {
                      setResignState({ tag: 'RSInChoose', isRed })
                  }
                : undefined,
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

    return { resignState, resignStateAddOn, resignEventHandlers }

    function doReset() {
        setResignState(RSNONE)
    }

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
