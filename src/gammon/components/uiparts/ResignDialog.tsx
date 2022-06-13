import { Fragment } from 'react'
import { ResignOffer, ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { ResignEventHandlers } from '../useResignDialog'
import { Button } from './Button'
import { Buttons } from './Buttons'
import { Dialog } from './Dialog'
import './resignDialog.css'

export type ResignDialogProps = {
    isGammonSaved?: boolean
    resignState: ResignState | ResignStateInChoose
} & Partial<ResignEventHandlers>
export type ResignStateInChoose = {
    tag: 'RSInChoose'
    isRed: boolean
    lastOffer?: ResignOffer
}
export function ResignDialog(props: ResignDialogProps) {
    const ZERO_WIDTH_SPACE = String.fromCharCode(8203)
    const doNothing = () => {
        //
    }
    const { isGammonSaved = false, resignState, ...handlers } = props
    const resignEventHandlers: ResignEventHandlers = {
        onCancel: doNothing,
        onOffer: doNothing,
        onReject: doNothing,
        onAccept: doNothing,
        ...handlers,
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
                                resignEventHandlers.onOffer(
                                    resignState,
                                    ResignOffer.Single
                                )
                            }
                        />
                        <Button
                            id="cancel"
                            onClick={resignEventHandlers.onCancel}
                        />
                    </Fragment>
                ) : (
                    <Fragment>
                        <Button
                            id="offerSingle"
                            onClick={() =>
                                resignEventHandlers.onOffer(
                                    resignState,
                                    ResignOffer.Single
                                )
                            }
                        />
                        <Button
                            id="offerGammon"
                            onClick={() =>
                                resignEventHandlers.onOffer(
                                    resignState,
                                    ResignOffer.Gammon
                                )
                            }
                        />
                        <Button
                            id="offerBackgammon"
                            onClick={() =>
                                resignEventHandlers.onOffer(
                                    resignState,
                                    ResignOffer.Backgammon
                                )
                            }
                        />
                        <Button
                            id="cancelResign"
                            onClick={resignEventHandlers.onCancel}
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
                    onClick={() => resignEventHandlers.onAccept(resignState)}
                />
                <Button
                    id="rejectOffer"
                    onClick={() => resignEventHandlers.onReject(resignState)}
                />
            </Buttons>
        </Dialog>
    ) : null
}
