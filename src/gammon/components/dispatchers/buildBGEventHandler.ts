import { BGEventHandler, concatBGListeners } from './BGEventHandler'
import { BGListener } from './BGListener'
import { cubeGameDispatcher } from './CubeGameDispatcher'

import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBToRoll,
} from 'tsgammon-core/states/CubeGameState'
import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGToRoll,
} from 'tsgammon-core/states/SingleGameState'
import { eogEventHandler } from './EOGEventHandlers'
import { RollListener, rollListener, withRL } from './RollDispatcher'
import { singleGameDispatcher } from './SingleGameDispatcher'

/**
 * BGListenerを後付け可能なBGEventHandler
 */
export type BGEventHandlersExtensible = BGEventHandler & {
    addListener: (toAdd: Partial<BGListener>) => BGEventHandlersExtensible
}

/**
 * BGEventHandler(BGEventHandlerExtensible)オブジェクトを生成する
 * @param skipCubeAction キューブアクション要否の判定関数（不要の場合、trueを返す）
 * @param rListener ダイスのロール目を供給するRollListenerオブジェクト
 * @param listeners BGEventHandlerに追加するBGListenerの配列
 * @returns
 */
export function buildBGEventHandler(
    skipCubeAction: (cbState: CBInPlay) => boolean,
    rListener: RollListener = rollListener(),
    ...listeners: Partial<BGListener>[]
): BGEventHandlersExtensible {
    return buildBGEventHandler_rec(skipCubeAction, rListener, {}, ...listeners)
}

function buildBGEventHandler_rec(
    skipCubeAction: (cbState: CBInPlay) => boolean,
    rListener: RollListener = rollListener(),
    _bgListeners: Partial<BGListener>,
    ...listeners: Partial<BGListener>[]
): BGEventHandlersExtensible {
    const bgListeners = listeners.reduce(
        (prev, cur) => concatBGListeners(prev, cur),
        _bgListeners
    )

    const handlers = _buildBGEventHandler(
        skipCubeAction,
        rListener,
        bgListeners
    )

    function addListeners(...toAdd: Partial<BGListener>[]) {
        return buildBGEventHandler_rec(
            skipCubeAction,
            rListener,
            bgListeners,
            ...toAdd
        )
    }

    return {
        ...handlers,
        addListener: addListeners,
    }
}

// singleGameDispatcherとcubeGameDispatcherを組み合わせて、BGEventHandlerを実装している
function _buildBGEventHandler(
    skipCubeAction: (cbState: CBInPlay) => boolean,
    rollListener: RollListener,
    bgListeners: Partial<BGListener>
): BGEventHandler {
    // チェッカープレイでの終局処理の定義
    const { onEndOfBGGame: onEndOfCubeGame } = eogEventHandler(bgListeners)
    const sgDispatcher = withRL(singleGameDispatcher, rollListener)

    const bgHandler = {
        onRollOpening: (bgState: {
            cbState: CBOpening
            sgState: SGOpening
        }) => {
            const sgResult = sgDispatcher.doOpeningRoll(bgState.sgState)
            sgResult({
                // オープニングロールがあった：キューブ側もチェッカープレイに遷移
                onOpeningCheckerPlayStarted: (nextSGState: SGInPlay) => {
                    const cbResult =
                        cubeGameDispatcher.doStartOpeningCheckerPlay(
                            bgState.cbState,
                            nextSGState.isRed
                        )
                    cbResult({
                        onAwaitCheckerPlay: (nextCBState: CBInPlay) => {
                            bgListeners.onAwaitCheckerPlay?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
                    })
                },
                // オープニングロールのリロール：Cube側には影響がないので、イベント通知のみ
                onRerollOpening: (nextSGState: SGOpening) => {
                    bgListeners.onBGOpeningRerolled?.({
                        cbState: bgState.cbState,
                        sgState: nextSGState,
                    })
                },
            })
        },

        onCommit: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => {
            const sgResult = sgDispatcher.doCommitCheckerPlay(bgState.sgState)
            sgResult({
                // チェッカープレイが終了した：単にイベントを通知するだけにし、
                // キューブの状態管理は他のListener(onAwaitRoll, onEndOfCubeGame)に任せる
                onCheckerPlayCommitted: (committedState: SGInPlay) => {
                    bgListeners.onCommitted?.({
                        cbState: bgState.cbState,
                        sgState: committedState,
                    })
                },

                // チェッカープレイが終了し、まだ終局でない：
                // キューブアクション状態またはロール待ち状態のいずれかへ遷移し、
                // 各Listenerに通知する
                onAwaitRoll: (nextSGState: SGToRoll) => {
                    const cbResult = cubeGameDispatcher.doStartCubeAction(
                        bgState.cbState,
                        skipCubeAction
                    )
                    cbResult({
                        onAwaitCubeAction: (
                            nextCBState: CBAction | CBToRoll
                        ) => {
                            bgListeners.onAwaitCubeAction?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
                        onCubeActionStarted: (nextCBState: CBAction) => {
                            bgListeners.onCubeActionStarted?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
                        onCubeActionSkipped: (nextCBState: CBToRoll) => {
                            bgListeners.onCubeActionSkipped?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
                    })
                },
                // ゲームが終了した：EoGを通知する
                onEndOfGame: (nextSGState: SGEoG) => {
                    onEndOfCubeGame(
                        { cbState: bgState.cbState, sgState: nextSGState },
                        nextSGState.result,
                        nextSGState.eogStatus
                    )
                },
            })
        },

        onRoll: (bgState: {
            cbState: CBToRoll | CBAction
            sgState: SGToRoll
        }) => {
            const sgResult = sgDispatcher.doRoll(bgState.sgState)
            sgResult({
                // チェッカープレイ状態に遷移した：キューブ側でも状態遷移する
                onCheckerPlayStarted: (nextSGState: SGInPlay) => {
                    const cbResult = cubeGameDispatcher.doStartCheckerPlay(
                        bgState.cbState
                    )
                    cbResult({
                        onAwaitCheckerPlay: (nextCBState: CBInPlay) => {
                            bgListeners.onAwaitCheckerPlay?.({
                                cbState: nextCBState,
                                sgState: nextSGState,
                            })
                        },
                    })
                },
            })
        },

        // ゲームを開始した：キューブ側でもゲーム開始
        onStartGame: () => {
            const sgResult = sgDispatcher.doStartGame()
            sgResult({
                onGameStarted: () => {
                    const cbResult = cubeGameDispatcher.doStartCubeGame()
                    cbResult({
                        onCubeGameStarted: () => {
                            bgListeners.onBGGameStarted?.()
                        },
                    })
                },
            })
        },

        // ダブルされた：キューブ側でもダブル
        onDouble: (bgState: { cbState: CBAction; sgState: SGToRoll }) => {
            const result = cubeGameDispatcher.doDouble(bgState.cbState)
            result({
                onDoubled: (nextState: CBResponse) => {
                    bgListeners.onDoubled?.(
                        {
                            cbState: nextState,
                            sgState: bgState.sgState,
                        },
                        bgState.cbState
                    )
                },
            })
        },

        // テイクされた：キューブ側でもテイク、さらに必要なら自動ロール
        onTake: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => {
            const result = cubeGameDispatcher.doTake(bgState.cbState)
            result({
                onDoubleAccepted: (nextState: CBToRoll) => {
                    bgListeners.onDoubleAccepted?.(
                        {
                            cbState: nextState,
                            sgState: bgState.sgState,
                        },
                        bgState.cbState
                    )
                    // Take後は自動ロール
                    bgHandler.onRoll({
                        cbState: nextState,
                        sgState: bgState.sgState,
                    })
                },
            })
        },

        // パスされた：キューブ側でもパス（終局状態となる）
        onPass: (bgState: { cbState: CBResponse; sgState: SGToRoll }) => {
            const result = cubeGameDispatcher.doPass(bgState.cbState)
            result({
                onEndOfCubeGame: (cbEoG: CBEoG) => {
                    bgListeners.onEndOfBGGame?.({
                        cbState: cbEoG,
                        sgState: bgState.sgState,
                    })
                },
            })
        },
    }
    return bgHandler
}
