import { eog, EOGStatus } from 'tsgammon-core/EOGStatus'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { ResignOffer } from 'tsgammon-core/ResignOffer'
import { RSNONE, RSOffered } from 'tsgammon-core/states/ResignState'
import { ResignEventHandler } from './ResignEventHandlers'

/**
 * RSEventHandlerオブジェクトを生成する
 *
 * @param listeners ResignHandlerから呼ばせるListener
 * @returns
 */
export function buildRSEventHandler(
    listeners: Partial<{
        offerResign: (resignState: RSOffered) => void
        acceptResign: (result: SGResult, eogStatus: EOGStatus) => void
        rejectResign: (resignState: RSOffered) => void
    }>
): ResignEventHandler {
    // どの条件で降参するかの選択は、U.I.側の管理なのでここには登場しない
    // ResignEventHandlerでは条件での分岐がないので、dispatcherはなく、
    // 単純にListenerに発生したイベントを通知するだけになっている
    return {
        onOfferResign: (offer: ResignOffer, isRed: boolean) =>
            isRed ? offerFromRedToWhite(offer) : offerFromWhiteToRed(offer),

        onRejectResign: (resignState: RSOffered) => {
            listeners.rejectResign?.(resignState)
        },

        onAcceptResign: (resignState: RSOffered) => {
            const offer = resignState.offer
            // resignState（=ResignをOfferされた側）がRedなら、Redの勝利
            const result = resignState.isRed
                ? SGResult.REDWON
                : SGResult.WHITEWON
            const eogStatus = eog({
                isGammon:
                    offer === ResignOffer.Gammon ||
                    offer === ResignOffer.Backgammon,
                isBackgammon: offer === ResignOffer.Backgammon,
            })
            listeners.acceptResign?.(result, eogStatus)
        },
    }

    // 以下の二つは、Red/Whiteのどちらからどちらへの降参かを明示するための定義
    function offerFromRedToWhite(offer: ResignOffer) {
        const offered = RSNONE.doOfferResignRed(offer)
        listeners.offerResign?.(offered)
    }

    function offerFromWhiteToRed(offer: ResignOffer) {
        const offered = RSNONE.doOfferResignWhite(offer)
        listeners.offerResign?.(offered)
    }
}
