/**
 *  指し手を表現するとともに、絶対表記を含め、様々なフォーマットでの出力に対応したインターフェース
 */
export interface AbsoluteMove {
    fromAbs: number
    toAbs: number

    fromAbsInv: number
    toAbsInv: number

    fromDec: number
    toDec: number

    fromAsc: number
    toAsc: number

    isBearOff: boolean
    isReenter: boolean
    isHit: boolean

    pip: number
}

export enum MoveFormatDirection {
    ABSOLUTE = 1, // Whiteは開始点を0とし、増加方向に駒を進める表記。Redは24から減少方向に進む
    ABSOLUTE_INV, //ABSOLUTEを反転させ、Redの開始点を0とする表記 */
    RELATIVE_ASC,// WhiteもRedも開始点を0とし、増加方向に駒を進める表記
    RELATIVE_DEC/// RELATIVE_ASCを反転させ、開始点を24とする表記
}

export function formatMove(move: AbsoluteMove
    , direction: MoveFormatDirection = MoveFormatDirection.RELATIVE_DEC): string {
    return moveFormatter(direction)(move)
}

export function formatMoves(moves: AbsoluteMove[]
    , direction: MoveFormatDirection = MoveFormatDirection.RELATIVE_DEC
    , labelNoMove: string = ""): string[] {

    if (moves.length === 0) {
        return [labelNoMove]
    }
    const mvFormatter = moveFormatter(direction)

    return moves.map(mvFormatter)
}

function moveFormatter(direction: MoveFormatDirection): (move: AbsoluteMove) => string {
    const getter: (move: AbsoluteMove) => number[] = (() => {
        switch (direction) {
            case MoveFormatDirection.ABSOLUTE: {
                return (move: AbsoluteMove) => [move.fromAbs, move.toAbs]
            }
            case MoveFormatDirection.ABSOLUTE_INV: {
                return (move: AbsoluteMove) => [move.fromAbsInv, move.toAbsInv]
            }
            case MoveFormatDirection.RELATIVE_ASC: {
                return (move: AbsoluteMove) => [move.fromAsc, move.toAsc]
            }
            case MoveFormatDirection.RELATIVE_DEC: {
                return (move: AbsoluteMove) => [move.fromDec, move.toDec]

            }
        }
    })()

    return (move: AbsoluteMove) => {
        const [mFrom, mTo] = getter(move)
        const from = move.isReenter ? "Bar" : mFrom
        const to = move.isBearOff ? "Off" : mTo
        const hit = move.isHit ? "*" : ""
        return `${from}/${to}${hit}`
    }
}