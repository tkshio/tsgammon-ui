import { BoardState } from 'tsgammon-core/BoardState'
import { BoardStateNode } from 'tsgammon-core/BoardStateNode'
import {
    SGInPlay,
    toAbsBoard,
    toPly as _toPly,
    toPos,
} from 'tsgammon-core/states/SingleGameState'
import { makeLeap } from 'tsgammon-core/utils/makeLeap'
import { makePoint } from 'tsgammon-core/utils/makePoint'
import { wrapNode } from 'tsgammon-core/utils/wrapNode'
import { CheckerPlayState, CheckerPlayStateCommitted } from './CheckerPlayState'

/**
 * チェッカープレイ開始状態を示すSGInPlayオブジェクトを、CheckerPlayStateオブジェクトに変換する
 * @param sgInPlay
 * @returns
 */
export function asCheckerPlayState(sgInPlay: SGInPlay): CheckerPlayState {
    // 通常はboardStateNode === rootNode.primaryだが、
    // 記録を再生する時はboardStateNodeにcommit直前の状態が格納されてsgiInPlayとして渡される
    const { boardStateNode, absBoard, rootNode } = sgInPlay
    const toPly = (node: BoardStateNode) => _toPly(sgInPlay, node)
    const curPly = toPly(boardStateNode)
    const isUndoable = rootNode.primary !== boardStateNode
    return {
        isCommitted: false,

        curPly,
        curBoardState: boardStateNode,
        absBoard,
        rootNode: rootNode,

        toPly,
        toPos: (absPos: number) => toPos(sgInPlay, absPos),
        toAbsBoard: (board: BoardState) => toAbsBoard(sgInPlay, board),

        isUndoable,
        selectAlternate: false,
    }
}

/**
 * 初期状態に復帰させる、ただし、selectAlternateの状態は維持する
 *
 * @param state
 * @returns
 */
export function resetCheckerPlayState(
    state: CheckerPlayState
): CheckerPlayState {
    const node =
        state.selectAlternate && state.rootNode.alternate
            ? state.rootNode.alternate
            : state.rootNode.primary
    return {
        ...state,
        curPly: state.toPly(node),
        curBoardState: node,
        absBoard: state.toAbsBoard(node.board),
        isUndoable: false,
    }
}

/**
 * selectAlternateフラグを反転させる
 * @param state
 * @returns
 */
export function revertSelection(state: CheckerPlayState): CheckerPlayState {
    const selectAlternate = !state.selectAlternate
    const curBoardState = isRootNodeSelected(state)
        ? selectAlternate && state.rootNode.alternate
            ? state.rootNode.alternate
            : state.rootNode.primary
        : state.curBoardState
    return {
        ...state,
        curBoardState,
        selectAlternate,
    }
}

function isRootNodeSelected(state: CheckerPlayState): boolean {
    return !state.isUndoable
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
    absPos: number
): { isValid: true; state: CheckerPlayState } | { isValid: false } {
    const pos = state.toPos(absPos)

    const node = wrapNode(
        isRootNodeSelected(state) ? state.rootNode : state.curBoardState,
        state.selectAlternate
    )
        // クリック位置から動かせる駒がある
        .apply((node) => node.childNode(pos))
        // クリック位置でポイントを作れる
        .or((node) => makePoint(node, pos))
        // クリック位置へ動かせる
        .or((node) => makeLeap(node, pos)).unwrap

    return node.hasValue
        ? {
              isValid: true,
              state: selectNode(state, node),
          }
        : { isValid: false }

    function selectNode(
        state: CheckerPlayState,
        node: BoardStateNode
    ): CheckerPlayState {
        return {
            ...state,
            curBoardState: node,
            absBoard: state.toAbsBoard(node.board),
            curPly: state.toPly(node),
            isUndoable: true,
        }
    }
}

/**
 * コミット可能状態のCheckerPlayStateを生成する
 * @param state
 * @returns
 */

export function committedCheckerPlayState(
    state: CheckerPlayState
): CheckerPlayStateCommitted {
    return {
        isCommitted: true,
        boardStateNode: state.curBoardState,
    }
}
