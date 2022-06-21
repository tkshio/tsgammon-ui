import { Fragment } from 'react'
import { EOGStatus } from 'tsgammon-core'
import { ResignOffer, ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { ResignEventHandlers } from '../useResignState'
import { Button } from './Button'
import { Buttons } from './Buttons'
import { Dialog } from './Dialog'
import './resignDialog.css'

export type ResignDialogProps = {
    isGammonSaved: boolean
    resignState: ResignState | RSToOffer
    acceptResign: (result: SGResult, eogStatus: EOGStatus) => void
} & Partial<ResignEventHandlers>

export type RSToOffer = {
    tag: 'RSToOffer'
    isRed: boolean
    lastOffer?: ResignOffer
}

export function ResignDialog(props: ResignDialogProps) {
    const ZERO_WIDTH_SPACE = String.fromCharCode(8203)
    const doNothing = () => {
        //
    }
    const { isGammonSaved, resignState, acceptResign, ..._handlers } = props
    const resignEventHandlers: ResignEventHandlers = {
        onCancelResign: doNothing,
        onOfferResign: () => undefined,
        onRejectResign: () => undefined,
        onResetResign: doNothing,
        onAcceptResign: doNothing,
        onResign: doNothing,
        ..._handlers,
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
    return resignState.tag === 'RSToOffer' ? (
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
                        {offerButton(resignState, ResignOffer.Single, 'offer')}
                        <Button
                            id="cancel"
                            onClick={resignEventHandlers.onCancelResign}
                        />
                    </Fragment>
                ) : (
                    <Fragment>
                        {offerButton(
                            resignState,
                            ResignOffer.Single,
                            'offerSingle'
                        )}
                        {offerButton(
                            resignState,
                            ResignOffer.Gammon,
                            'offerGammon'
                        )}
                        {offerButton(
                            resignState,
                            ResignOffer.Backgammon,
                            'offerBackgammon'
                        )}
                        <Button
                            id="cancelResign"
                            onClick={resignEventHandlers.onCancelResign}
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
                    onClick={() =>
                        resignEventHandlers.onAcceptResign(
                            resignState,
                            acceptResign
                        )
                    }
                />
                <Button
                    id="rejectOffer"
                    onClick={() =>
                        resignEventHandlers.onRejectResign(resignState)
                    }
                />
            </Buttons>
        </Dialog>
    ) : null

    function offerButton(
        resignState: RSToOffer,
        offer: ResignOffer,
        id: string
    ) {
        return (
            <Button
                id={id}
                onClick={() => {
                    resignEventHandlers.onOfferResign(offer, resignState.isRed)
                }}
            />
        )
    }
}
