import { BGState } from 'tsgammon-core/states/BGState'
import {
    CBAction,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll,
} from 'tsgammon-core/states/CubeGameState'
import {
    SGInPlay,
    SGOpening,
    SGToRoll,
} from 'tsgammon-core/states/SingleGameState'
import { BGListener } from './BGListener'
import { SingleGameEventHandler } from './SingleGameEventHandler'
import { concat0, concat1, concat2 } from './utils/concat'

/**
 * 標準的なバックギャモン、キューブありの時にU.I.として提供する操作の定義：引数には、イベント発生前の状態を渡さないといけない。
 *
 */
export type BGEventHandler = {
    /**
     * オープニングロールを行う
     */
    onRollOpening: (bgState: { cbState: CBOpening; sgState: SGOpening }) => void

    /**
     * 駒の移動を確定する
     */
    onCommit: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => void

    /**
     * ロールを行う
     */
    onRoll: (bgState: {
        cbState: CBToRoll | CBAction
        sgState: SGToRoll
    }) => void

    /**
     * ゲームを開始する
     */
    onStartGame: () => void

    /**
     * ダブルする
     */
    onDouble: (bgState: { cbState: CBAction; sgState: SGToRoll }) => void

    /**
     * テイクする
     */
    onTake: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => void

    /**
     * パスする
     */
    onPass: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => void
}

/**
 * BGHandlerをSingleGameHandlerに変換する
 * @returns
 */
export function asSGEventHandler(
    cbState: CBState,
    handlers: Partial<BGEventHandler>
): SingleGameEventHandler {
    return {
        onStartGame: () => {
            handlers.onStartGame?.()
        },
        onCommit: (sgState: SGInPlay) => {
            if (cbState.tag === 'CBInPlay') {
                handlers.onCommit?.({ cbState, sgState })
            }
        },
        onRoll: (sgState: SGToRoll) => {
            if (cbState.tag === 'CBToRoll' || cbState.tag === 'CBAction') {
                handlers.onRoll?.({ cbState, sgState })
            }
        },
        onRollOpening: (sgState: SGOpening) => {
            if (cbState.tag === 'CBOpening') {
                handlers.onRollOpening?.({ cbState, sgState })
            }
        },
    }
}

/**
 * BGListenerを接合し、一つのBGListenerにする
 *
 * @param bg1 BGListener（先に実行される）
 * @param bg2 BGListener（後に実行される）
 * @returns
 */
export function concatBGListeners(
    bg1: Partial<BGListener>,
    bg2: Partial<BGListener>
): Partial<BGListener> {
    return {
        onBGGameStarted: concat0(bg1.onBGGameStarted, bg2.onBGGameStarted),
        onBGOpeningRerolled: concat1(
            bg1.onBGOpeningRerolled,
            bg2.onBGOpeningRerolled
        ),
        onAwaitCubeAction: concat1(
            bg1.onAwaitCubeAction,
            bg2.onAwaitCubeAction
        ),
        onCubeActionStarted: concat1(
            bg1.onCubeActionStarted,
            bg2.onCubeActionStarted
        ),
        onCubeActionSkipped: concat1(
            bg1.onCubeActionSkipped,
            bg2.onCubeActionSkipped
        ),
        onDoubled: concat2(bg1.onDoubled, bg2.onDoubled),
        onDoubleAccepted: concat2(bg1.onDoubleAccepted, bg2.onDoubleAccepted),
        onPassed: concat2(bg1.onPassed, bg2.onPassed),
        onAwaitCheckerPlay: concat1(
            bg1.onAwaitCheckerPlay,
            bg2.onAwaitCheckerPlay
        ),
        onCommitted: concat1(bg1.onCommitted, bg2.onCommitted),
        onEndOfBGGame: concat1(bg1.onEndOfBGGame, bg2.onEndOfBGGame),
    }
}

/**
 * 状態の保持を行うためのBGListenerを生成する
 *
 * @param defaultState ゲーム開始時の初期配置
 * @param setBGState 状態保持関数
 * @returns
 */
export function setBGStateListener(
    defaultState: BGState,
    setBGState: (bgState: BGState) => void
): BGListener {
    return {
        onBGGameStarted: () => setBGState(defaultState),
        onBGOpeningRerolled: (bgState: BGState) => setBGState(bgState),
        onAwaitCubeAction: () => {
            //
        },
        onCubeActionStarted: (bgState: BGState) => setBGState(bgState),
        onAwaitCheckerPlay: (bgState: BGState) => setBGState(bgState),
        onCommitted: () => {
            //
        },
        onDoubled: (bgState: BGState) => setBGState(bgState),
        onDoubleAccepted: (bgState: BGState) => setBGState(bgState),
        onPassed: () => {
            //
        },
        onCubeActionSkipped: (bgState: BGState) => setBGState(bgState),
        onEndOfBGGame: (bgState: BGState) => setBGState(bgState),
    }
}
