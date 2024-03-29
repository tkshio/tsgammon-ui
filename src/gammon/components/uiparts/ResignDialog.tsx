import { Fragment } from 'react'
import { ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { ResignOffer } from 'tsgammon-core/ResignOffer'
import { RSDialogHandler, RSToOffer } from '../RSDialogHandler'
import { Button } from './Button'
import { Buttons } from './Buttons'
import { Dialog } from './Dialog'
import { defaultPlayersConf, PlayersConf } from '../PlayersConf'
import './resignDialog.css'

export type ResignDialogProps = {
    isGammonSaved: boolean
    resignState: ResignState | RSToOffer
    playersConf?: PlayersConf
} & Partial<RSDialogHandler>

export function ResignDialog(props: ResignDialogProps) {
    const { isGammonSaved, resignState, playersConf=defaultPlayersConf, ...resignEventHandlers } =
        props

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
                      ]
                    : [`Select offer: `]
            }
        >
            <Buttons>
                {isGammonSaved ? (
                    <Fragment>
                        {offerButton(resignState, ResignOffer.Single, {
                            id: 'offer',
                            role: 'offer-single',
                        })}
                        <Button
                            id="cancel"
                            onClick={resignEventHandlers.onCancelResign}
                        />
                    </Fragment>
                ) : (
                    <Fragment>
                        {resignState.lastOffer === undefined &&
                            offerButton(resignState, ResignOffer.Single, {
                                id: 'offerSingle',
                                role: 'offer-single',
                            })}
                        {(resignState.lastOffer === undefined ||
                            resignState.lastOffer === ResignOffer.Single) &&
                            offerButton(resignState, ResignOffer.Gammon, {
                                id: 'offerGammon',
                                role: 'offer-gammon',
                            })}
                        {(resignState.lastOffer === undefined ||
                            resignState.lastOffer === ResignOffer.Single ||
                            resignState.lastOffer === ResignOffer.Gammon) &&
                            offerButton(resignState, ResignOffer.Backgammon, {
                                id: 'offerBackgammon',
                                role: 'offer-backgammon',
                            })}
                        <Button
                            id="cancelResign"
                            role="cancel-resign"
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
                `${
                    resignState.isRed
                        ? playersConf.white.name
                        : playersConf.red.name
                } offers to resign at: ${format(resignState.offer)}`,
            ]}
        >
            <Buttons>
                <Button
                    id="acceptResign"
                    role="accept-resign"
                    onClick={() =>
                        resignEventHandlers.onAcceptResign?.(resignState)
                    }
                />
                <Button
                    id="rejectResign"
                    role="reject-resign"
                    onClick={() =>
                        resignEventHandlers.onRejectResign?.(resignState)
                    }
                />
            </Buttons>
        </Dialog>
    ) : null

    function offerButton(
        resignState: RSToOffer,
        offer: ResignOffer,
        attrs: { id: string; role: string }
    ) {
        return (
            <Button
                {...attrs}
                onClick={() => {
                    resignEventHandlers.onOfferResign?.(
                        offer,
                        resignState.isRed
                    )
                }}
            />
        )
    }
}
