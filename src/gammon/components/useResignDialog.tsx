import { useState } from 'react'
import { eog, EOGStatus } from 'tsgammon-core'
import {
    ResignState,
    rsNone,
    ResignOffer,
    RSOffered,
} from 'tsgammon-core/dispatchers/ResignState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { ResignStateInChoose } from './uiparts/ResignDialog'

export type MayResignOrNot =
    | { mayResign: true; isRed: boolean }
    | { mayResign: false; isRed: undefined }

export type ResignEventHandlers = {
    cancel: () => void
    offer: (resignState: ResignStateInChoose, offer: ResignOffer) => void
    reject: (resignState: RSOffered) => void
    accept: (resignState: RSOffered) => void
}

export function useResignDialog(
    mayResignOrNot: MayResignOrNot,
    onEndGame: (result: SGResult, eogStatus: EOGStatus) => void
) {
    const { mayResign, isRed } = mayResignOrNot
    const [resignState, setResignState] = useState<
        ResignState | ResignStateInChoose
    >(rsNone())

    // Resign可能な時は、ハンドラーを設定してU.I.から降参が選べるようにする
    const onResign =
        mayResign && resignState.tag === 'RSNone'
            ? () => {
                  setResignState({ tag: 'RSInChoose', isRed })
              }
            : undefined

    // Resign中は、ダイアログを生成する
    const onAcceptResign = (
        offer: ResignOffer,
        result: SGResult.REDWON | SGResult.WHITEWON
    ) => {
        const eogStatus = eog({
            isGammon:
                offer === ResignOffer.Gammon ||
                offer === ResignOffer.Backgammon,
            isBackgammon: offer === ResignOffer.Backgammon,
        })
        onEndGame(result, eogStatus)
    }

    // 必要な状態管理機能を集約
    const resignEventHandlers = {
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
    return { resignState, onResign, resignEventHandlers }
}