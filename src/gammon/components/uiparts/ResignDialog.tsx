import { Fragment } from 'react'
import {
    ResignOffer,
    ResignState,
    rsNone,
    RSOffered,
} from 'tsgammon-core/dispatchers/ResignState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { Dialog } from './Dialog'

export type ResignDialogProps = {
    resignState: ResignState | ResignStateInChoose
    setResignState: (resign: ResignState | ResignStateInChoose) => void
    onAcceptResign: (
        resign: ResignOffer,
        result: SGResult.REDWON | SGResult.WHITEWON
    ) => void
}
export type ResignStateInChoose = {
    tag: 'RSInChoose'
    isRed: boolean
    lastOffer?: ResignOffer
}
export function ResignDialog(props: ResignDialogProps) {
    const {
        resignState,
        setResignState = () => {
            //
        },
        onAcceptResign = () => {
            //
        },
    } = props
    const eventHandlers = {
        cancel: () => setResignState(rsNone()),
        offer: (resignState: ResignStateInChoose, offer: ResignOffer) =>
            setResignState(
                resignState.isRed
                    ? rsNone().doOfferResignWhite(offer)
                    : rsNone().doOfferResignRed(offer)
            ),
        reject: (resignState: RSOffered) =>
            setResignState({
                tag: 'RSInChoose',
                isRed: !resignState.isRed,
                lastOffer: resignState.offer,
            }),
        accept: (resignState: RSOffered) => {
            setResignState(rsNone())
            onAcceptResign(
                resignState.offer,
                resignState.isRed ? SGResult.WHITEWON : SGResult.REDWON
            )
        },
    }
    function format(offer: ResignOffer): string {
        switch (offer) {
            case ResignOffer.Backgammon:
                return 'Backgammon'
            case ResignOffer.Gammon:
                return 'Gammon'
            case ResignOffer.Single:
                return 'Single'
        }
    }
    // 提示条件を決めるダイアログ
    return resignState.tag === 'RSInChoose' ? (
        <Dialog
            msgs={
                resignState.lastOffer
                    ? [
                          `Your offer(${format(
                              resignState.lastOffer
                          )}) was rejected`,
                      ]
                    : []
            }
        >
            <Fragment>
                <div
                    onClick={() =>
                        eventHandlers.offer(resignState, ResignOffer.Single)
                    }
                >
                    Single
                </div>
                <div
                    onClick={() =>
                        eventHandlers.offer(resignState, ResignOffer.Gammon)
                    }
                >
                    Gammon
                </div>
                <div
                    onClick={() =>
                        eventHandlers.offer(resignState, ResignOffer.Backgammon)
                    }
                >
                    Backgammon
                </div>
                <div onClick={eventHandlers.cancel}>Cancel</div>
            </Fragment>
        </Dialog>
    ) : // 提示を受けるかどうかのダイアログ
    resignState.tag === 'RSOffered' ? (
        <Dialog
            msgs={[
                `Opponent offers to resign at a ${format(resignState.offer)}`,
            ]}
        >
            <Fragment>
                <div onClick={() => eventHandlers.accept(resignState)}>
                    Accept
                </div>
                <div onClick={() => eventHandlers.reject(resignState)}>
                    Reject
                </div>
            </Fragment>
        </Dialog>
    ) : null
}
