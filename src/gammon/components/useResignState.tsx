import { useState } from 'react'
import { BoardState, BoardStateNode, CubeState, eog, EOGStatus } from 'tsgammon-core'
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
import { SGResult } from 'tsgammon-core/records/SGResult'

export type MayResignOrNot =
    | { mayResign: true; isRed: boolean }
    | { mayResign: false; isRed: undefined }

export type ResignEventHandlers = {
    onResign?: () => void
    onCancelResign: () => void
    onOfferResign: (
        resignState: ResignStateInChoose,
        offer: ResignOffer
    ) => RSOffered | undefined
    onRejectResign: (resignState: RSOffered) => ResignStateInChoose | undefined
    onResetResign: () => void
    onAcceptResign: (resignState: RSOffered) => void
}

const RSNONE = rsNone()
export function useResignState(
    cubeState:CubeState,
    mayResignOrNot: MayResignOrNot,
    autoOperators?: { rs?: RSOperator },
) {
    const { mayResign, isRed } = mayResignOrNot
    const [resignState, setResignState] = useState<
        ResignState | ResignStateInChoose
    >(RSNONE)

    // 必要な状態管理機能を集約
    const resignEventHandlers: (
        acceptResign: (result: SGResult, eogStatus: EOGStatus) => void
    ) => ResignEventHandlers = (
        acceptResign: (result: SGResult, eogStatus: EOGStatus) => void
    ) => ({
        onCancelResign: doReset,
        onOfferResign: (resignState: ResignStateInChoose, offer: ResignOffer) =>
            resignState.isRed
                ? offerFromRedToWhite(offer)
                : offerFromWhiteToRed(offer),
        onRejectResign: (resignState: RSOffered) => {
            const inChoose: ResignStateInChoose = {
                tag: 'RSInChoose',
                isRed: !resignState.isRed,
                lastOffer: resignState.offer,
            }
            setResignState(inChoose)
            return inChoose
        },
        onResetResign: doReset,
        onResign:
            mayResign && resignState.tag === 'RSNone'
                ? () => {
                      setResignState({ tag: 'RSInChoose', isRed })
                  }
                : undefined,
        onAcceptResign: (resignState: RSOffered) => {
            doReset()
            const offer = resignState.offer
            // resignState = ResignをOfferされた側がRedなら、Redの勝利
            const result = resignState.isRed
                ? SGResult.REDWON
                : SGResult.WHITEWON
            const eogStatus = eog({
                isGammon:
                    offer === ResignOffer.Gammon ||
                    offer === ResignOffer.Backgammon,
                isBackgammon: offer === ResignOffer.Backgammon,
            })
            acceptResign(result, eogStatus)
        },
    })

    const { rs } = autoOperators ?? {}
    const resignStateAddOn: SGEventHandlerAddOn = rs
        ? {
              eventHandlers: {},
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
          }
        : { eventHandlers: {}, listeners: {} }

    return { resignState, resignStateAddOn, resignEventHandlers }

    function doReset() {
        setResignState(RSNONE)
    }

    function doOfferOperation(
        rs: RSOperator,
        isRed: boolean,
        lastOffer: ResignOffer | undefined,
        sgState: { boardState: BoardState; node?: BoardStateNode },
        cubeState: CubeState
    ) {
        rs[isRed ? 'operateRedOfferAction' : 'operateWhiteOfferAction'](
            offerFromRedToWhite,
            lastOffer,
            cubeState,
            sgState.boardState,
            sgState.node
        )
    }
    function offerFromRedToWhite(offer: ResignOffer) {
        const offered = RSNONE.doOfferResignRed(offer)
        setResignState(offered)
        return offered
    }
    function offerFromWhiteToRed(offer: ResignOffer) {
        const offered = RSNONE.doOfferResignWhite(offer)
        setResignState(offered)
        return offered
    }
}
