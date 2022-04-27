import { Dice, wrap } from 'tsgammon-core'
import { findMove } from 'tsgammon-core/utils/findMove'
import { makePoint } from 'tsgammon-core/utils/makePoint'
import { CheckerPlayState, CheckerPlayStateCommitted } from './CheckerPlayState'
export type CheckerPlayDispatcher = {
    doCheckerPlay: (
        state: CheckerPlayState,
        absPos: number,
        dices: Dice[]
    ) => void
    doRevertDices: (state: CheckerPlayState) => void
    doUndo: (state: CheckerPlayState) => void
    doCommitCheckerPlay: (state: CheckerPlayState) => void
    doRedo: (state: CheckerPlayState) => void
}

export type CheckerPlayListeners = {
    onCheckerPlay: (state: CheckerPlayState) => void
    onRevertDices: (state: CheckerPlayState) => void
    onUndo: (state: CheckerPlayState) => void
    onCommitCheckerPlay: (state: CheckerPlayStateCommitted) => void
    onRedo: (state: CheckerPlayState) => void
}

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

    function doCheckerPlay(
        state: CheckerPlayState,
        absPos: number,
        dices: Dice[]
    ) {
        const pos = state.toPos(absPos)

        // Board上の実配置に基づき、小さい目を先に使うかどうかを判定する
        // ゾロ目でなく、両方使える時で、左側が小さい目の時だけ、
        // 小さい方が優先
        const useMinorFirst: boolean =
            dices.length === 2 &&
            dices[0].pip < dices[1].pip &&
            !dices[0].used &&
            !dices[1].used

        const node = wrap(state.curBoardState)
            .apply((node) => findMove(node, pos, useMinorFirst))
            .or((node) => makePoint(node, pos)).unwrap
        if (node.hasValue) {
            const stateAfterMove: CheckerPlayState = {
                ...state,
                curBoardState: node,
                absBoard: state.toAbsBoard(node.board),
                curPly: state.toPly(node),
                isUndoable: true,
            }
            listeners.onCheckerPlay(stateAfterMove)
        }
    }

    function doRevertDices(state: CheckerPlayState) {
        const reverted = { ...state, revertDicesFlag: !state.revertDicesFlag }
        listeners.onRevertDices(reverted)
    }

    function doUndo(state: CheckerPlayState) {
        const reverted: CheckerPlayState = {
            ...state,
            curPly: {
                moves: [],
                dices: state.boardStateNodeRevertTo.dices.map(
                    (dice) => dice.pip
                ),
                isRed: state.curPly.isRed,
            },
            curBoardState: state.boardStateNodeRevertTo,
            absBoard: state.absBoardRevertTo,
            isUndoable: false,
            // revertDicesFlag: false ダイスの入れ替え状態はアンドゥでも維持
        }
        listeners.onUndo(reverted)
    }

    function doCommitCheckerPlay(state: CheckerPlayState) {
        const committed: CheckerPlayStateCommitted = {
            isCommitted: true,
            boardStateNode: state.curBoardState,
        }
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
