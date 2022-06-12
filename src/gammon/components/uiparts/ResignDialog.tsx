import { Fragment } from 'react'
import {
    ResignOffer,
    ResignState,
    rsNone,
    RSOffered,
} from 'tsgammon-core/dispatchers/ResignState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { Button } from './Button'
import { Buttons } from './Buttons'
import { Dialog } from './Dialog'
import './resignDialog.css'

export type ResignDialogProps = {
    isGammonSaved?: boolean
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
    const ZERO_WIDTH_SPACE = String.fromCharCode(8203)
    const {
        isGammonSaved = false,
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
                          `Your offer${
                              isGammonSaved
                                  ? ''
                                  : ' (' + format(resignState.lastOffer) + ')'
                          } was rejected`,
                          ZERO_WIDTH_SPACE,
                      ]
                    : [`Select offer: `, ZERO_WIDTH_SPACE]
            }
        >
            <Buttons>
                {isGammonSaved ? (
                    <Fragment>
                        <Button
                            id="offer"
                            onClick={() =>
                                eventHandlers.offer(
                                    resignState,
                                    ResignOffer.Single
                                )
                            }
                        />
                        <Button id="cancel" onClick={eventHandlers.cancel} />
                    </Fragment>
                ) : (
                    <Fragment>
                        <Button
                            id="offerSingle"
                            onClick={() =>
                                eventHandlers.offer(
                                    resignState,
                                    ResignOffer.Single
                                )
                            }
                        />
                        <Button
                            id="offerGammon"
                            onClick={() =>
                                eventHandlers.offer(
                                    resignState,
                                    ResignOffer.Gammon
                                )
                            }
                        />
                        <Button
                            id="offerBackgammon"
                            onClick={() =>
                                eventHandlers.offer(
                                    resignState,
                                    ResignOffer.Backgammon
                                )
                            }
                        />
                        <Button
                            id="cancelResign"
                            onClick={eventHandlers.cancel}
                        />
                    </Fragment>
                )}
            </Buttons>
        </Dialog>
    ) : // 提示を受けるかどうかのダイアログ
    resignState.tag === 'RSOffered' ? (
        <Dialog
            msgs={[
                `Opponent offers to resign at: ${format(resignState.offer)}`,
                ZERO_WIDTH_SPACE,
            ]}
        >
            <Buttons>
                <Button
                    id="acceptOffer"
                    onClick={() => eventHandlers.accept(resignState)}
                />
                <Button
                    id="rejectOffer"
                    onClick={() => eventHandlers.reject(resignState)}
                />
            </Buttons>
        </Dialog>
    ) : null
}
