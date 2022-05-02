import { decorate } from './SingleGameDispatcher'
import { CBState } from './CubeGameState'
import { CubeGameDispatcher } from './CubeGameDispatcher'
import { SingleGameListeners } from './SingleGameDispatcher'
import { SGEoG, SGInPlay, SGToRoll } from './SingleGameState'

export function cubefulSGListener(
    listeners: Partial<SingleGameListeners>,
    cbState: CBState,
    skipCubeAction:boolean,
    dispatcher: CubeGameDispatcher,
) {
    return decorate(listeners, asSGListeners(cbState, skipCubeAction, dispatcher))
}

function asSGListeners(
    state: CBState,
    skipCubeAction:boolean,
    cbDispatcher: CubeGameDispatcher) {
    return {
        // オープニングロールがあった：手番を設定してInPlay状態に遷移
        onStartOpeningCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBOpening') {
                cbDispatcher.doStartOpeningCheckerPlay(state, sgInPlay.isRed)
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // チェッカープレイが終了した：キューブアクション状態またはロール待ち状態に遷移
        onAwaitRoll: (sgToRoll: SGToRoll) => {
            if (state.tag === 'CBInPlay') {
                cbDispatcher.doStartCubeAction(state, skipCubeAction)
            } else {
                console.warn('Unexpected state', state, sgToRoll)
            }
        },

        // ロールがあった：InPlay状態に遷移
        onStartCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBToRoll' || state.tag === 'CBAction') {
                cbDispatcher.doStartCheckerPlay(state)
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // ゲームが終了した：キューブを加味したスコアを算出
        onEndOfGame: (sgEoG: SGEoG) => {
            cbDispatcher.doEndOfCubeGame(
                state,
                sgEoG.result,
                sgEoG.eogStatus,
            )
        },
    }
}
