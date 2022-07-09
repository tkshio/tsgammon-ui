import { EOGStatus } from 'tsgammon-core'
import {
    RSNONE,
    resignEventHandlers,
} from 'tsgammon-core/dispatchers/ResignEventHandlers'
import {
    ResignOffer,
    ResignState,
    RSOffered,
} from 'tsgammon-core/dispatchers/ResignState'
import { SGResult } from 'tsgammon-core/records/SGResult'

export type RSToOffer = {
    tag: 'RSToOffer'
    isRed: boolean
    lastOffer?: ResignOffer
}

export type RSDialogHandlers = {
    onOfferResign: (offer: ResignOffer, isRed: boolean) => RSOffered | undefined
    onRejectResign: (resignState: RSOffered) => RSToOffer | undefined
    onAcceptResign: (resignState: RSOffered) => void
    onResign: (isRed: boolean) => void
    onCancelResign: () => void
    onResetResign: () => void
}

export function rsDialogHandlers(
    setResignState: (resignState: ResignState | RSToOffer) => void,
    acceptResign: (result: SGResult, eog: EOGStatus) => void
): RSDialogHandlers {
    const rsEventHandlers = resignEventHandlers({
        offerResign: (resignState: RSOffered) => {
            setResignState(resignState)
        },
        acceptResign: (result: SGResult, eog: EOGStatus) => {
            acceptResign(result, eog)
            setResignState(RSNONE)
        },
        rejectResign: (resignState: RSOffered) => {
            setResignState({
                tag: 'RSToOffer',
                isRed: resignState.isRed,
                lastOffer: resignState.offer,
            })
        },
    })
    return {
        ...rsEventHandlers,
        onRejectResign: (resignState: RSOffered) => {
            rsEventHandlers.onRejectResign(resignState)
            return {
                tag: 'RSToOffer',
                isRed: resignState.isRed,
                lastOffer: resignState.offer,
            }
        },
        onResign: (isRed: boolean) => {
            setResignState({
                tag: 'RSToOffer',
                isRed: isRed,
            })
        },
        onCancelResign: () => {
            setResignState(RSNONE)
        },
        onResetResign: () => {
            setResignState(RSNONE)
        },
    }
}
