import { AbsoluteBoardState } from 'tsgammon-core/AbsoluteBoardState'
import { BoardState } from 'tsgammon-core/BoardState'
import { BoardStateNode } from 'tsgammon-core/BoardStateNode'
import { BoardStateNodeRoot } from 'tsgammon-core/BoardStateNodeRoot'
import { Ply } from 'tsgammon-core/Ply'
/**
 * チェッカープレイが未確定の状態を表す
 */
export type CheckerPlayState = {
    isCommitted: false

    curPly: Ply
    curBoardState: BoardStateNode
    absBoard: AbsoluteBoardState
    isUndoable: boolean
    rootNode: BoardStateNodeRoot
    toAbsBoard: (board: BoardState) => AbsoluteBoardState
    toPly: (board: BoardStateNode) => Ply
    toPos: (n: number) => number
    selectAlternate: boolean
}

/**
 * チェッカープレイが確定した状態を表す
 */
export type CheckerPlayStateCommitted = {
    isCommitted: true
    boardStateNode: BoardStateNode
}
