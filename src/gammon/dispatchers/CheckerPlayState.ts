import { AbsoluteBoardState } from 'tsgammon-core/AbsoluteBoardState'
import { BoardState } from 'tsgammon-core/BoardState'
import { BoardStateNode } from 'tsgammon-core/BoardStateNode'
import { Ply } from 'tsgammon-core/Ply'
import { SGInPlay } from './SingleGameState'

export type CheckerPlayState = {
    isCommitted: false

    curPly: Ply
    curBoardState: BoardStateNode
    absBoard: AbsoluteBoardState
    isUndoable: boolean
    boardStateNodeRevertTo: BoardStateNode
    absBoardRevertTo: AbsoluteBoardState
    toAbsBoard: (board: BoardState) => AbsoluteBoardState
    toPly: (board: BoardStateNode) => Ply
    toPos: (n: number) => number
    revertDicesFlag: boolean
}

export type CheckerPlayStateCommitted = {
    isCommitted: true
    boardStateNode: BoardStateNode
}

export function asCheckerPlayState(sgInPlay: SGInPlay): CheckerPlayState {
    const { boardStateNode, absBoard, revertTo, toAbsBoard, toPly, toPos } =
        sgInPlay
    const curPly = toPly(boardStateNode)
    const isUndoable = curPly.moves.length > 0
    return {
        isCommitted: false,

        curPly,
        curBoardState: boardStateNode,
        absBoard,
        boardStateNodeRevertTo: revertTo,
        absBoardRevertTo: toAbsBoard(revertTo.board),

        toAbsBoard,
        toPly,
        toPos,

        isUndoable,
        revertDicesFlag: false,
    }
}
