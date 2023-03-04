import { Dice } from 'tsgammon-core/Dices'
import {
    CheckerPlayState,
    CheckerPlayStateCommitted,
} from 'tsgammon-core/states/CheckerPlayState'
import { findMove } from 'tsgammon-core/utils/findMove'
import { makeLeap } from 'tsgammon-core/utils/makeLeap'
import { makePoint } from 'tsgammon-core/utils/makePoint'
import { wrapNode } from 'tsgammon-core/utils/wrapNode'

/**
 * 未確定の状態のチェッカープレイを管理する：CheckerPlayでは機能追加の必要性が薄いので、
 * CheckerPlayHandlerを設けず簡素な定義のままになっている
 */
export type CheckerPlayDispatcher = {
    // チェッカープレイを行う
    doCheckerPlay: (
        state: CheckerPlayState,
        absPos: number,
        dices: Dice[]
    ) => void

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
    function doCheckerPlay(
        state: CheckerPlayState,
        absPos: number,
        dices: Dice[]
    ) {
        const ret = applyCheckerPlay(state, absPos, dices)
        if (ret.isValid) {
            listeners.onCheckerPlay(ret.state)
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
            curBoardState: state.boardStateNodeRevertTo.primary,
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

/**
 * 任意のポイントがクリックされたとき、それに対応するムーブを決定し、
 * そのムーブの適用後の局面を返す
 *
 * @param state 現局面（そこから可能な局面のツリーを含む）
 * @param absPos クリックされたポイントの絶対座標（=White視点の座標）
 * @param dices ダイス状態の配列：インデックスの小さいものを優先して使用する
 * @returns
 */
export function applyCheckerPlay(
    state: CheckerPlayState,
    absPos: number,
    dices: Dice[]
): { isValid: true; state: CheckerPlayState } | { isValid: false } {
    const pos = state.toPos(absPos)

    // Board上の実配置に基づき、小さい目を先に使うかどうかを判定する
    // ゾロ目でなく、両方使える時で、左側が小さい目の時だけ、
    // 小さい方が優先
    const useMinorFirst: boolean =
        dices.length === 2 &&
        dices[0].pip < dices[1].pip &&
        !dices[0].used &&
        !dices[1].used

    const node = wrapNode(state.curBoardState, useMinorFirst)
        // クリック位置から動かせる駒がある
        .apply((node) => findMove(node, pos, useMinorFirst))
        // クリック位置でポイントを作れる
        .or((node) => makePoint(node, pos))
        // クリック位置へ動かせる
        .or((node) => makeLeap(node, pos)).unwrap

    return node.hasValue
        ? {
              isValid: true,
              state: {
                  ...state,
                  curBoardState: node,
                  absBoard: state.toAbsBoard(node.board),
                  curPly: state.toPly(node),
                  isUndoable: true,
              },
          }
        : { isValid: false }
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
