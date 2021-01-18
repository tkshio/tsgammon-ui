import {BoardState} from "./BoardState";
import {AbsoluteBoardState, redViewAbsoluteBoard, whiteViewAbsoluteBoard} from "./AbsoluteBoardState";
import {CubeOwner} from "./CubeState";
import {GameStatus, gameStatus} from "./GameStatus";
import {Score, score} from "./Score";

/**
 * GameStateと組み合わせて、手番を管理するためのシングルトンなオブジェクト
 *
 * 実際に盤面に応じた手を検討・判断するのはGameOperator, GammonEnginesの担当
 */
export type Player = {
    side: CubeOwner
    opponent(): Player
    makeAbsoluteBoard(board: BoardState): AbsoluteBoardState
    makeAbsolutePos(board: BoardState, absPos: number): number
    stake(stakeValue: number): Score;
    getScore(score: Score): number

    commitCheckerPlay: GameStatus;
    cubeResponse: GameStatus;
    cubeAction: GameStatus;
    rollDice: GameStatus;
    checkerPlay: GameStatus;
}
export const whitePlayer = buildWhitePlayer()
export const redPlayer = whitePlayer.opponent()

function buildWhitePlayer() {
    const dummy = {} as Player
    const redPlayer: Player = {
        side: CubeOwner.RED,
        cubeAction: gameStatus.cubeActionRed,
        checkerPlay: gameStatus.checkerPlayRed,
        cubeResponse: gameStatus.cubeResponseRed,
        rollDice: gameStatus.rollDiceRed,
        commitCheckerPlay: gameStatus.commitCheckerPlayRed,
        makeAbsoluteBoard: redViewAbsoluteBoard,
        makeAbsolutePos: (board: BoardState, n: number) => board.invertPos(n),
        stake(stakeValue: number) {
            return score({redScore: stakeValue});
        },
        getScore(score: Score): number {
            return score.redScore
        },
        opponent: () => dummy
    }
    const whitePlayer: Player = {
        side: CubeOwner.WHITE,
        cubeAction: gameStatus.cubeActionWhite,
        checkerPlay: gameStatus.checkerPlayWhite,
        cubeResponse: gameStatus.cubeResponseWhite,
        rollDice: gameStatus.rollDiceWhite,
        commitCheckerPlay: gameStatus.commitCheckerPlayWhite,
        makeAbsoluteBoard: whiteViewAbsoluteBoard,
        makeAbsolutePos: (board: BoardState, n: number) => n,
        stake(stakeValue: number) {
            return score({whiteScore: stakeValue});
        },
        getScore(score: Score): number {
            return score.whiteScore
        },
        opponent: () => redPlayer
    }
    redPlayer.opponent = () => whitePlayer

    return whitePlayer
}
