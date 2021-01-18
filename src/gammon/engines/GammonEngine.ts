import {GameState, GammonMessageMove} from "../models/GameState";
import {AbsoluteMove} from "../models/AbsoluteMove";
import {BoardState} from "../models/BoardState";
import {Dices} from "../models/Dices";

export interface GammonEngine {

    initialized(gameState: GameState): void;

    cubeResponse(gameState: GameState): { isTake: boolean }

    cubeAction(gameState: GameState): { isDouble: boolean }

    checkerPlay(gameState: GameState): GammonMessageMove[]

    endOfGame(gameState: GameState): void;
}

export function movesToMsgs(moves: AbsoluteMove[]): GammonMessageMove[] {

    const useMinorFirst = moves.length === 2 &&
        moves[0].pip < moves[1].pip

    return moves.map(move => {
        return {type: "Move", pos: move.fromAbs, useMinorFirst: useMinorFirst}
    })
}

export function randomEngine(): GammonEngine {
    return {
        initialized(_: GameState): void {
        },
        cubeResponse(_: GameState): { isTake: boolean } {
            return {isTake: true};
        },
        cubeAction(_: GameState): { isDouble: boolean } {
            return {isDouble: false};
        },
        checkerPlay(gameState: GameState): GammonMessageMove[] {
            const moves = gameState.moves()
            const n = (Math.floor(Math.random() * moves.length))
            return movesToMsgs(moves[n])
        },

        endOfGame(_: GameState): void {
        },
    };
}

export interface Evaluator {
    initialize(gameState: GameState): void

    endOfGame(gameState: GameState): void

    evaluate(dices: Dices, moves: AbsoluteMove[], boardState: BoardState): number
}

export function evaluator(ev: Partial<Evaluator>): Evaluator {
    const defaultEv = {
        initialize(_: GameState) {
        },
        endOfGame(_: GameState) {
        },
        evaluate(_: Dices, __: AbsoluteMove[], ___: BoardState) {
            return Math.random()
        }
    }
    return {...defaultEv, ...ev}
}

type Ev = { msgs: GammonMessageMove[], e: number }

export function simpleEvalEngine(ev: Evaluator): GammonEngine {
    return {
        initialized(state: GameState): void {
            ev.initialize(state)
        },
        cubeResponse(gameState: GameState): { isTake: boolean } {
            const myBoard = gameState.board()
            const e = ev.evaluate([], [], myBoard)
            return {isTake: (e >= -0.5)}; // 勝率25％相当
        },
        cubeAction(opponentState: GameState): { isDouble: boolean } {
            const myBoard = opponentState.board().revert() // まだRoll前なので、相手方の観点で渡される
            const e = ev.evaluate([], [], myBoard)
            return {isDouble: (e >= 0.40)}; // 勝率70%相当
        },
        checkerPlay(gameState: GameState): GammonMessageMove[] {
            const candidates = gameState.moves()
            const bestEv = candidates.map(
                (m: AbsoluteMove[]) => {
                    return evalState(gameState, m)
                })
                .reduce(
                    (prev, cur) => {
                        return (prev.e > cur.e) ? prev : cur
                    },
                    {msgs: [], e: Number.NEGATIVE_INFINITY})

            return bestEv.msgs;
        },
        endOfGame(state: GameState): void {
            ev.endOfGame(state)
        },
    };

    function evalState(gameState: GameState, m: AbsoluteMove[]): Ev {
        const msgs = movesToMsgs(m)
        const afterMove = gameState.reduce(...msgs)
        const e = ev.evaluate(gameState.dices(), m, afterMove.board())
        return {msgs: msgs, e: e};
    }
}

