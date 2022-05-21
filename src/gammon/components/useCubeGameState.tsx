import { CubeGameDispatcher } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGEoG,
    SGInPlay, SGToRoll
} from 'tsgammon-core/dispatchers/SingleGameState'

export function cubefulSGListener(
    state: CBState,
    dispatcher: CubeGameDispatcher
): Partial<SingleGameListeners> {
    return {
        // オープニングロールがあった：手番を設定してInPlay状態に遷移
        onStartOpeningCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBOpening') {
                dispatcher.doStartOpeningCheckerPlay(state, sgInPlay.isRed)
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // チェッカープレイが終了した：キューブアクション状態またはロール待ち状態に遷移
        onAwaitRoll: (sgToRoll: SGToRoll) => {
            if (state.tag === 'CBInPlay') {
                dispatcher.doStartCubeAction(state)
            } else {
                console.warn('Unexpected state', state, sgToRoll)
            }
        },

        // ロールがあった：InPlay状態に遷移
        onStartCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBToRoll' || state.tag === 'CBAction') {
                dispatcher.doStartCheckerPlay(state)
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // ゲームが終了した：キューブを加味したスコアを算出
        onEndOfGame: (sgEoG: SGEoG) => {
            dispatcher.doEndOfCubeGame(state, sgEoG.result, sgEoG.eogStatus)
        },
    }
}
