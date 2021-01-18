import {GameState, Ply} from "./GameState";
import {formatMoves, MoveFormatDirection} from "./AbsoluteMove";
import {formatDices} from "./Dices";

/**
 * １プレイヤーの一回の手番を表す型
 */
export type PlyRecord = {
    type: "Commit" | "Double" | "Take" | "Pass" | "EOG",
    state: GameState,
    isRed(): boolean,
    isWhite(): boolean
}

export function plyRecord(type: "Commit" | "Double" | "Take" | "Pass" | "EOG", state: GameState): PlyRecord {
    return {
        type: type, state: state,
        isRed: () => isRed(state),
        isWhite: () => isWhite(state)
    };

    function isWhite(gameState: GameState) {
        return gameState.status.label.endsWith("White")
    }

    function isRed(gameState: GameState) {
        return gameState.status.label.endsWith("Red")
    }
}

export function formatPlyInfoAbbr(plyInfo: Ply,
                                  direction: MoveFormatDirection = MoveFormatDirection.RELATIVE_DEC,
                                  fmtDoublet: boolean = true,
                                  labelNoMove: string = "") {

    if (plyInfo.dices.length === 0) {
        return ""
    }

    const roll = formatDices(plyInfo.dices, fmtDoublet)
    const moves = formatMoves(plyInfo.moves, direction, labelNoMove).join(" ")
    return `${roll}: ${moves}`
}

export function formatPly(plyRecord: PlyRecord,
                          direction: MoveFormatDirection = MoveFormatDirection.RELATIVE_DEC,
                          fmtDoublet: boolean = true,
                          labelNoMove: string = "") {
    const state = plyRecord.state
    switch (plyRecord.type) {
        case "Commit": {
            return formatPlyInfoAbbr(state.curPlay, direction, fmtDoublet, labelNoMove)
        }
        case "Double": {
            const value = state.cube?.doubledValue() ?? 2;
            return " Doubles => " + value
        }
        case "Pass": {
            return "Pass"
        }
        case "Take": {
            return " Takes"
        }
        case "EOG": {

            const stake = plyRecord.state.stake
            const whiteWon = formatStake(stake.whiteScore)
            const redWon = formatStake(stake.redScore)
            return whiteWon + redWon
        }
    }

    function formatStake(score: number): string {
        return score === 0 ? "" : `Wins ${score} point`
    }
}