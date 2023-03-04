import {
    CheckerPlayState,
    CheckerPlayStateCommitted,
} from '../states/CheckerPlayState'
import {
    applyCheckerPlay,
    committedCheckerPlayState,
    resetCheckerPlayState,
    revertSelection,
} from '../states/CheckerPlayStateUtils'

/**
 * 未確定の状態のチェッカープレイを管理する：CheckerPlayでは機能追加の必要性が薄いので、
 * CheckerPlayHandlerを設けず簡素な定義のままになっている
 */
export type CheckerPlayDispatcher = {
    // チェッカープレイを行う
    doCheckerPlay: (state: CheckerPlayState, absPos: number) => void

    // ダイスの使用順序を入れ替える
    doRevertDices: (state: CheckerPlayState) => void

    // チェッカープレイを取り消す
    doUndo: (state: CheckerPlayState) => void

    // チェッカープレイを確定させる
    doCommitCheckerPlay: (state: CheckerPlayState) => void

    // 取り消したチェッカープレイをやり直す
    doRedo: (state: CheckerPlayState) => void
}

/**
 * 未確定の状態のチェッカープレイによって発生するイベントの通知先
 */
export type CheckerPlayListeners = {
    onCheckerPlay: (state: CheckerPlayState) => void
    onRevertDices: (state: CheckerPlayState) => void
    onUndo: (state: CheckerPlayState) => void
    onCommitCheckerPlay: (state: CheckerPlayStateCommitted) => void
    onRedo: (state: CheckerPlayState) => void
}

/**
 * CheckerPlayDispatcherオブジェクトを生成する
 * @param listeners
 * @returns
 */
export function checkerPlayDispatcher(
    listeners: CheckerPlayListeners
): CheckerPlayDispatcher {
    return {
        doCheckerPlay,
        doRevertDices,
        doUndo,
        doCommitCheckerPlay,
        doRedo,
    }
    function doCheckerPlay(state: CheckerPlayState, absPos: number) {
        const ret = applyCheckerPlay(state, absPos)
        if (ret.isValid) {
            listeners.onCheckerPlay(ret.state)
        }
    }
    function doRevertDices(state: CheckerPlayState) {
        const reverted = revertSelection(state)
        listeners.onRevertDices(reverted)
    }

    function doUndo(state: CheckerPlayState) {
        const reverted = resetCheckerPlayState(state)
        listeners.onUndo(reverted)
    }

    function doCommitCheckerPlay(state: CheckerPlayState) {
        const committed = committedCheckerPlayState(state)
        listeners.onCommitCheckerPlay(committed)
    }
    function doRedo(state: CheckerPlayState) {
        listeners.onRedo(state)
    }
}

export function fill(
    listeners: Partial<CheckerPlayListeners>
): CheckerPlayListeners {
    const doNothing: CheckerPlayListeners = {
        onCheckerPlay: () => {
            //
        },
        onRevertDices: () => {
            //
        },
        onUndo: () => {
            //
        },
        onCommitCheckerPlay: () => {
            //
        },
        onRedo: () => {
            //
        },
    }

    return {
        ...doNothing,
        ...listeners,
    }
}

export function decorate(
    base: CheckerPlayListeners,
    ...listeners: Partial<CheckerPlayListeners>[]
): CheckerPlayListeners {
    return listeners.reduce(
        (prev: CheckerPlayListeners, cur: Partial<CheckerPlayListeners>) => {
            const {
                onCheckerPlay,
                onRevertDices,
                onUndo,
                onCommitCheckerPlay,
                onRedo,
            } = cur
            return {
                onCheckerPlay: onCheckerPlay
                    ? (state: CheckerPlayState) => {
                          prev.onCheckerPlay(state)
                          onCheckerPlay(state)
                      }
                    : prev.onCheckerPlay,
                onRevertDices: onRevertDices
                    ? (state: CheckerPlayState) => {
                          prev.onRevertDices(state)
                          onRevertDices(state)
                      }
                    : prev.onRevertDices,
                onUndo: onUndo
                    ? (state: CheckerPlayState) => {
                          prev.onUndo(state)
                          onUndo(state)
                      }
                    : prev.onUndo,
                onCommitCheckerPlay: onCommitCheckerPlay
                    ? (state: CheckerPlayStateCommitted) => {
                          prev.onCommitCheckerPlay(state)
                          onCommitCheckerPlay(state)
                      }
                    : prev.onCommitCheckerPlay,
                onRedo: onRedo
                    ? (state: CheckerPlayState) => {
                          prev.onRedo(state)
                          onRedo(state)
                      }
                    : prev.onRedo,
            }
        },
        base
    )
}

export function setCPStateListener(
    setState: (state: CheckerPlayState | undefined) => void
): CheckerPlayListeners {
    return {
        onCheckerPlay: setState,
        onRevertDices: setState,
        onUndo: setState,
        onCommitCheckerPlay: () => {
            setState(undefined)
        }, // Commitした後は格納しない
        onRedo: setState,
    }
}
