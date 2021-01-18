import {initBoardState, BoardState} from "./BoardState";


/**
 * 盤面を絶対座標で表現した、主に表示用のインターフェース
 * ポイントの座標は、Whiteのスタートが0（MoveFormatDirection.ABSOLUTE）で表記される
 */
export interface AbsoluteBoardState {
    /**
     * 各ポイントの駒数を格納した配列を返す
     */
    points(): number[]

    /**
     * 指定されたポイントの駒数を返す。正はWhiteの、負はRedの駒数を示す
     * @param n
     */
    piecesAt(n: number): number

    /**
     * すでに上がったWhiteの駒の数を返す。
     */
    whiteBornOff(): number;

    /**
     * すでに上がったRedの駒の数を返す（負数ではなく、正の値を返すことに注意）。
     */
    redBornOff(): number;
}

export const standard = [
    0,
    2, 0, 0, 0, 0, -5, 0, -3, 0, 0, 0, 5,
    -5, 0, 0, 0, 3, 0, 5, 0, 0, 0, 0, -2,
    0
]

export function initAbsoluteBoard(pieces: number[] = standard, bornOffs: [number, number] = [0, 0]): AbsoluteBoardState {
    const board = initBoardState(pieces, bornOffs)
    return whiteViewAbsoluteBoard(board)
}

/**
 * 相対表記であるBoardStateを、Whiteの観点で絶対表記に変換する。
 * 実質的にはそのまま返す
 * @param boardState
 */
export function whiteViewAbsoluteBoard(boardState: BoardState): AbsoluteBoardState {
    return {
        points: () => boardState.points(),
        piecesAt: (n) => boardState.piecesAt(n),
        whiteBornOff: () => boardState.myBornOff(),
        redBornOff: () => boardState.opponentBornOff()
    }
}

/**
 * 相対表記であるBoardStateを、Redの観点で絶対表記に変換する。
 * 実質的には座標を反転、駒数も正負反転させて返す
 * @param boardState
 */
export function redViewAbsoluteBoard(boardState: BoardState): AbsoluteBoardState {
    const boardSize = boardState.points().length - 1
    return {
        points: () => boardState.points().slice().reverse().map(v => v === 0 ? v : -v),
        piecesAt: (n) => -boardState.piecesAt(boardSize - n),
        whiteBornOff: () => boardState.opponentBornOff(),
        redBornOff: () => boardState.myBornOff()
    }
}
