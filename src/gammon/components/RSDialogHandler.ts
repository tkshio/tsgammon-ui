import { EOGStatus } from 'tsgammon-core'

import {buildRSEventHandler} from 'tsgammon-core/dispatchers/buildRSEventHandler'
import {
    ResignState,
    RSNONE,
    RSOffered,
} from 'tsgammon-core/dispatchers/ResignState'
import {
    concat0,
    concat1,
    concat2,
} from 'tsgammon-core/dispatchers/utils/concat'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { ResignOffer } from 'tsgammon-core/ResignOffer'

export type RSToOffer = {
    tag: 'RSToOffer'
    isRed: boolean
    lastOffer?: ResignOffer
}
export type RSDialogListener = {
    offerResign: (resignState: RSOffered) => void
    acceptResign: (result: SGResult, eog: EOGStatus) => void
    rejectResign: (resignState: RSToOffer) => void
    startResign: (resignState: RSToOffer) => void
    resetResignState: () => void
}

export type RSDialogHandler = {
    onOfferResign: (offer: ResignOffer, isRed: boolean) => void
    onRejectResign: (resignState: RSOffered) => void
    onAcceptResign: (resignState: RSOffered) => void
    onResign: (isRed: boolean) => void
    onCancelResign: () => void
    onResetResign: () => void
    withListener: (listener: Partial<RSDialogListener>) => RSDialogHandler
}

export function rsDialogHandler(
    setResignState: (resignState: ResignState | RSToOffer) => void,
    acceptResign: (result: SGResult, eog: EOGStatus) => void
): RSDialogHandler {
    const rsListeners = {
        offerResign: (resignState: RSOffered) => {
            setResignState(resignState)
        },
        acceptResign: (result: SGResult, eog: EOGStatus) => {
            acceptResign(result, eog)
            setResignState(RSNONE)
        },
        rejectResign: (resignState: RSToOffer) => {
            setResignState(resignState)
        },
        startResign: (resignState: RSToOffer) => {
            setResignState(resignState)
        },
        resetResignState: () => {
            setResignState(RSNONE)
        },
    }
    return _rsDialogHandler(rsListeners)
}

function _rsDialogHandler(
    rsListener: Partial<RSDialogListener>
): RSDialogHandler {
    const rsEventHandler = buildRSEventHandler({
        ...rsListener,
        rejectResign: (resignState: RSOffered) => {
            rsListener.rejectResign?.({
                tag: 'RSToOffer',
                isRed: !resignState.isRed,
                lastOffer: resignState.offer,
            })
        },
    })
    return {
        ...rsEventHandler,
        onResign: (isRed: boolean) => {
            rsListener.startResign?.({
                tag: 'RSToOffer',
                isRed: isRed,
            })
        },
        onCancelResign: () => {
            rsListener.resetResignState?.()
        },
        onResetResign: () => {
            rsListener.resetResignState?.()
        },
        withListener: (listener: Partial<RSDialogListener>) => {
            return _rsDialogHandler(concatRSListeners(rsListener, listener))
        },
    }
}

function concatRSListeners(
    rs1: Partial<RSDialogListener>,
    rs2: Partial<RSDialogListener>
): Partial<RSDialogListener> {
    return {
        offerResign: concat1(rs1.offerResign, rs2.offerResign),
        acceptResign: concat2(rs1.acceptResign, rs2.acceptResign),
        rejectResign: concat1(rs1.rejectResign, rs2.rejectResign),
        startResign: concat1(rs1.startResign, rs2.startResign),
        resetResignState: concat0(rs1.resetResignState, rs2.resetResignState),
    }
}
