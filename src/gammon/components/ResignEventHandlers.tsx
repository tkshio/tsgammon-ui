import { eog, EOGStatus } from 'tsgammon-core';
import { ResignOffer, ResignState, rsNone, RSOffered } from 'tsgammon-core/dispatchers/ResignState';
import { SGResult } from 'tsgammon-core/records/SGResult';
import { RSToOffer } from './uiparts/ResignDialog';

export const RSNONE = rsNone()

export type ResignEventHandlers = {
    onResign: (isRed: boolean) => void;
    onCancelResign: () => void;
    onOfferResign: (offer: ResignOffer, isRed: boolean) => RSOffered | undefined;
    onRejectResign: (resignState: RSOffered) => RSToOffer | undefined;
    onResetResign: () => void;
    onAcceptResign: (
        resignState: RSOffered,
        acceptResign: (result: SGResult, eogStatus: EOGStatus) => void
    ) => void;
};

export function resignEventHandlers(
    setResignState: (resignState: ResignState | RSToOffer) => void
): ResignEventHandlers {
    return {
        onCancelResign: doReset,
        onOfferResign: (offer: ResignOffer, isRed: boolean) =>
            isRed ? offerFromRedToWhite(offer) : offerFromWhiteToRed(offer),
        onRejectResign: (resignState: RSOffered) => {
            const toOffer: RSToOffer = {
                tag: 'RSToOffer',
                isRed: !resignState.isRed,
                lastOffer: resignState.offer,
            }
            setResignState(toOffer)
            return toOffer
        },
        onResetResign: doReset,
        onResign: (isRed: boolean) => {
            setResignState({ tag: 'RSToOffer', isRed })
        },
        onAcceptResign: (
            resignState: RSOffered,
            acceptResign: (result: SGResult, eogStatus: EOGStatus) => void
        ) => {
            doReset()
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
            acceptResign(result, eogStatus)
        },
    }

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
