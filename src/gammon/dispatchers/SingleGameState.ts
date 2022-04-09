import {
    AbsoluteBoardState,
    redViewAbsoluteBoard,
    whiteViewAbsoluteBoard,
} from 'tsgammon-core/AbsoluteBoardState'
import {
    AbsoluteMove,
    makeMoveAbsoluteAsRed,
    makeMoveAbsoluteAsWhite,
} from 'tsgammon-core/AbsoluteMove'
import { BoardState, EOGStatus } from 'tsgammon-core/BoardState'
import { BoardStateNode, boardStateNode } from 'tsgammon-core/BoardStateNode'
import { Dice, DicePip, DiceRoll } from 'tsgammon-core/Dices'
import { Move } from 'tsgammon-core/Move'
import { Ply } from 'tsgammon-core/Ply'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { Score, scoreAsRed, scoreAsWhite } from 'tsgammon-core/Score'

export type SGState = SGOpening | SGInPlay | SGToRoll | SGEoG
export type SGInPlay = SGInPlayRed | SGInPlayWhite
export type SGToRoll = SGToRollRed | SGToRollWhite
export type SGEoG = SGEoGRedWon | SGEoGWhiteWon

export type SGGameState = {
    absBoard: AbsoluteBoardState
}

export type SGOpening = Omit<SGGameState, 'lastPly'> & {
    tag: 'SGOpening'
    dicePip?: DicePip
    doOpening: (openingRoll: DiceRoll) => SGInPlay | SGOpening
}

type _SGInPlay = SGGameState & {
    tag: 'SGInPlay'
    dices: Dice[]
    curPly: Ply
    boardStateNode: BoardStateNode
    revertTo: BoardStateNode
    toPly: (boardStateNode: BoardStateNode) => Ply
    toAbsBoard: (boardState: BoardState) => AbsoluteBoardState
    toPos: (absPos: number) => number
}

export type SGInPlayRed = _SGInPlay & {
    isRed: true
    doCheckerPlayCommit: (
        boardStateNode: BoardStateNode,
        revertTo: BoardStateNode
    ) => SGToRollWhite | SGEoGRedWon
}

export type SGInPlayWhite = _SGInPlay & {
    isRed: false
    doCheckerPlayCommit: (
        boardStateNode: BoardStateNode,
        revertTo: BoardStateNode
    ) => SGToRollRed | SGEoGWhiteWon
}

type _SGToRoll = SGGameState & {
    tag: 'SGToRoll'
    boardState: BoardState
    lastPly: Ply
}

export type SGToRollRed = _SGToRoll & {
    isRed: true
    doRoll: (dices: DiceRoll) => SGInPlayRed
    lastState: () => SGInPlayWhite
}

export type SGToRollWhite = _SGToRoll & {
    isRed: false
    doRoll: (dices: DiceRoll) => SGInPlayWhite
    lastState: () => SGInPlayRed
}

export type _SGEoG = SGGameState & {
    tag: 'SGEoG'
    dices: Dice[]
    stake: Score
    eogStatus: EOGStatus
}

export type SGEoGRedWon = _SGEoG & {
    result: SGResult.REDWON
    isRed: true
    lastState: () => SGInPlayRed
}

export type SGEoGWhiteWon = _SGEoG & {
    result: SGResult.WHITEWON
    isRed: false
    lastState: () => SGInPlayWhite
}

export function openingState(
    boardState: BoardState,
    dicePip?: DicePip
): SGOpening {
    const absBoard = whiteViewAbsoluteBoard(boardState)
    return {
        tag: 'SGOpening',
        dicePip,
        absBoard,
        doOpening: (openingRoll: DiceRoll) => {
            if (openingRoll.dice1 === openingRoll.dice2) {
                return openingState(boardState, openingRoll.dice1)
            } else {
                const isRedPlayerFirst = openingRoll.dice1 > openingRoll.dice2
                const boardToPlay = isRedPlayerFirst
                    ? boardState.revert()
                    : boardState

                const inPlayState = isRedPlayerFirst
                    ? inPlayStateRed
                    : inPlayStateWhite

                return inPlayState(boardToPlay, openingRoll)
            }
        },
    }
}

export function inPlayStateRed(
    boardState: BoardState,
    dices: DiceRoll
): SGInPlayRed {
    const node = boardStateNode(boardState, dices)

    return inPlayStateRedFromNode(
        node,
        {
            dices: node.dices.map((dice) => dice.pip),
            moves: [],
            isRed: true,
        },
        node
    )
}

export function inPlayStateRedFromNode(
    boardStateNode: BoardStateNode,
    curPly: Ply,
    revertTo: BoardStateNode
): SGInPlayRed {
    const dices = boardStateNode.dices
    const absBoard = redViewAbsoluteBoard(boardStateNode.board)
    const toPly = buildToPly(boardStateNode.dices, makeMoveAbsoluteAsRed, true)

    const doCheckerPlayCommit = buildDoCheckerCommit(
        toPly,
        toRollStateWhite,
        eogStateRed
    )

    return {
        curPly,
        tag: 'SGInPlay',
        boardStateNode,
        dices,
        absBoard,
        revertTo,
        toPly,
        toPos: (n: number) => boardStateNode.board.invertPos(n),
        toAbsBoard: redViewAbsoluteBoard,

        isRed: true,
        doCheckerPlayCommit,
    }
}

export function inPlayStateWhite(
    boardState: BoardState,
    dices: DiceRoll
): SGInPlayWhite {
    const node = boardStateNode(boardState, dices)
    return inPlayStateWhiteFromNode(
        node,
        {
            dices: node.dices.map((dice) => dice.pip),
            moves: [],
            isRed: false,
        },
        node
    )
}

function inPlayStateWhiteFromNode(
    boardStateNode: BoardStateNode,
    curPly: Ply,
    revertTo: BoardStateNode
): SGInPlayWhite {
    const dices = boardStateNode.dices
    const absBoard = whiteViewAbsoluteBoard(boardStateNode.board)
    const toPly = buildToPly(
        boardStateNode.dices,
        makeMoveAbsoluteAsWhite,
        false
    )

    const doCheckerPlayCommit = buildDoCheckerCommit(
        toPly,
        toRollStateRed,
        eogStateWhite
    )

    return {
        curPly,
        tag: 'SGInPlay',
        boardStateNode,
        dices,
        absBoard,
        revertTo,
        toPly,
        toPos: (n: number) => n,
        toAbsBoard: whiteViewAbsoluteBoard,

        isRed: false,
        doCheckerPlayCommit,
    }
}

function buildDoCheckerCommit<TOROLL extends SGToRoll, EOG extends SGEoG>(
    toPly: (board: BoardStateNode) => Ply,
    toRollState: (
        boardState: BoardState,
        lastPly: Ply,
        lastNode: BoardStateNode,
        revertTo: BoardStateNode
    ) => TOROLL,
    toEoGState: (
        stakeValue: number,
        lastPly: Ply,
        committed: BoardStateNode,
        revertTo: BoardStateNode
    ) => EOG
): (committed: BoardStateNode, revertTo: BoardStateNode) => EOG | TOROLL {
    return (committed: BoardStateNode, revertTo: BoardStateNode) => {
        const ply = toPly(committed)
        const boardState = committed.board
        const eogStatus = boardState.eogStatus()

        if (eogStatus.isEndOfGame) {
            return toEoGState(1, ply, committed, revertTo)
        } else {
            // 手番プレイヤーと相対表記の盤面とをそれぞれ入れ替える
            const nextBoardState = boardState.revert()
            return toRollState(nextBoardState, ply, committed, revertTo)
        }
    }
}

export function toRollStateRed(
    boardState: BoardState,
    lastPly: Ply,
    lastNode: BoardStateNode,
    revertTo: BoardStateNode
): SGToRollRed {
    const absBoard = redViewAbsoluteBoard(boardState)
    return {
        tag: 'SGToRoll',
        boardState,
        absBoard,

        isRed: true,
        lastState: () => inPlayStateWhiteFromNode(lastNode, lastPly, revertTo),
        lastPly,

        doRoll: (dices: DiceRoll): SGInPlayRed => {
            return inPlayStateRed(boardState, dices)
        },
    }
}

export function toRollStateWhite(
    boardState: BoardState,
    lastPly: Ply,
    lastNode: BoardStateNode,
    revertTo: BoardStateNode
): SGToRollWhite {
    const absBoard = whiteViewAbsoluteBoard(boardState)
    return {
        tag: 'SGToRoll',
        boardState,
        absBoard,

        isRed: false,
        lastState: () => inPlayStateRedFromNode(lastNode, lastPly, revertTo),
        lastPly,

        doRoll: (dices: DiceRoll): SGInPlayWhite => {
            return inPlayStateWhite(boardState, dices)
        },
    }
}

export function eogStateRed(
    stakeValue: number,
    lastPly: Ply,
    committed: BoardStateNode,
    revertTo: BoardStateNode
): SGEoGRedWon {
    const board = committed.board
    const eogStatus = board.eogStatus()
    const stake = scoreAsRed(eogStatus.calcStake(stakeValue, false))

    return {
        ...eogState(board.eogStatus(), stake, redViewAbsoluteBoard(board)),
        result: SGResult.REDWON,
        isRed: true,
        lastState: () => inPlayStateRedFromNode(committed, lastPly, revertTo),
    }
}

export function eogStateWhite(
    stakeValue: number,
    lastPly: Ply,
    committed: BoardStateNode,
    revertTo: BoardStateNode
): SGEoGWhiteWon {
    const board = committed.board
    const eogStatus = board.eogStatus()
    const stake = scoreAsWhite(eogStatus.calcStake(stakeValue, false))

    return {
        ...eogState(eogStatus, stake, whiteViewAbsoluteBoard(board)),
        result: SGResult.WHITEWON,
        isRed: false,
        lastState: () => inPlayStateWhiteFromNode(committed, lastPly, revertTo),
    }
}

function eogState(
    eogStatus: EOGStatus,
    stake: Score,
    absBoard: AbsoluteBoardState
): _SGEoG {
    return {
        tag: 'SGEoG',
        absBoard,
        dices: [],
        stake,
        eogStatus,
    }
}

function buildToPly(
    dices: Dice[],
    toAbsMove: (move: Move, invertPos: (pos: number) => number) => AbsoluteMove,
    isRed: boolean
): (boardStateNode: BoardStateNode) => Ply {
    return (boardStateNode: BoardStateNode) => {
        return {
            moves: boardStateNode
                .lastMoves()
                .map((m) => toAbsMove(m, boardStateNode.board.invertPos)),
            dices: dices.map((dice) => dice.pip),
            isRed: isRed,
            isWhite: !isRed,
        }
    }
}
