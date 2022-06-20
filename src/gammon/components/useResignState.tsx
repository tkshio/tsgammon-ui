import { useState } from 'react'
import {
    eog,
    EOGStatus
} from 'tsgammon-core'
import {
    ResignOffer, ResignState,
    rsNone, RSOffered
} from 'tsgammon-core/dispatchers/ResignState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { ResignStateInChoose } from './uiparts/ResignDialog'

export type MayResignOrNot =
    | { mayResign: true; isRed: boolean }
    | { mayResign: false; isRed: undefined }

export type ResignEventHandlers = {
    onResign?: () => void
    onCancelResign: () => void
    onOfferResign: (
        offer: ResignOffer,
        isRed:boolean
    ) => RSOffered | undefined
    onRejectResign: (resignState: RSOffered) => ResignStateInChoose | undefined
    onResetResign: () => void
    onAcceptResign: (
        resignState: RSOffered,
        acceptResign: (result: SGResult, eogStatus: EOGStatus) => void
    ) => void
}

const RSNONE = rsNone()

export function useResignState(
    mayResignOrNot: MayResignOrNot,
) {
    const { mayResign, isRed } = mayResignOrNot
    const [resignState, setResignState] = useState<
        ResignState | ResignStateInChoose
    >(RSNONE)

    // 必要な状態管理機能を集約
    const resignEventHandlers: ResignEventHandlers = {
        onCancelResign: doReset,
        onOfferResign: ( offer: ResignOffer, isRed:boolean) =>
            isRed
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
        onAcceptResign: (
            resignState: RSOffered,
            acceptResign: (result: SGResult, eogStatus: EOGStatus) => void
        ) => {
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
    }

    return { resignState, resignEventHandlers }

    function doReset() {
        setResignState(RSNONE)
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
