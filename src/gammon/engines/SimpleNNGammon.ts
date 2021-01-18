import {evaluator, GammonEngine, simpleEvalEngine} from "./GammonEngine";
import {add, Matrix2d, matrix2d, product} from "./Matrix";
import {hidden_bias, hidden_weight, output_bias, output_weight} from "./td_default";
import {formatMoves} from "../models/AbsoluteMove";

const hiddenL: Layer = layer(hidden_weight, hidden_bias)
const outputL: Layer = layer(output_weight, output_bias)

export function dnEngine(): GammonEngine {

    return simpleEvalEngine(evaluator({
        evaluate: (dices, moves, board) => {
            const e = evalWithNN(board.points(), board.myBornOff(), board.opponentBornOff())
            const [oppWin, oppGammon, myWin, myGammon] = e
            const [oppWinFixed, oppGammonFixed, myWinFixed, myGammonFixed] = e.map(n => n.toFixed(2));
            const evalRet = myWin + myGammon - oppWin - oppGammon
            console.log(formatMoves(moves).join(' '), `e=${evalRet.toFixed(2)} (s:${myWinFixed} g:${myGammonFixed} / s:${oppWinFixed} g:${oppGammonFixed})`)
            return evalRet
        }
    }))
}

export function evalWithNN(pieces: number[], myBornOff: number, oppBornOff: number): number[] {
    const inputValues = matrix2d([encode(pieces, myBornOff, oppBornOff)])
    const hiddenOut = hiddenL.calcOutput(inputValues)
    const output = outputL.calcOutput(hiddenOut)

    return output.arr[0];
}

function encode(pieces: number[], myBornOff: number, oppBornOff: number): number[] {
    const input: number[] = Array(198)
    pieces.forEach(
        (p, i) => {
            if (1 <= i && i <= 24) {
                const pos = i - 1
                if (p > 0) {
                    input[pos * 8] = 1.0; // p > 0
                    input[pos * 8 + 1] = (p > 1) ? 1.0 : 0.0;
                    input[pos * 8 + 2] = (p > 2) ? 1.0 : 0.0;
                    input[pos * 8 + 3] = (p - 3) / 2.0;
                } else if (p < 0) {
                    input[pos * 8 + 4] = 1.0;
                    input[pos * 8 + 5] = (-p > 1) ? 1.0 : 0.0;
                    input[pos * 8 + 6] = (-p > 2) ? 1.0 : 0.0;
                    input[pos * 8 + 7] = (-p - 3) / 2.0;
                }
            }
        }
    )
    const idx = 24 * 8
    input[idx] = pieces[0] / 2.0
    input[idx + 1] = -pieces[25] / 2.0
    input[idx + 2] = myBornOff / 15
    input[idx + 3] = oppBornOff / 15
    input[idx + 4] = 1
    input[idx + 5] = 0

    return input;
}


type Layer = {
    weight: Matrix2d, bias: Matrix2d
    calcOutput(inputValues: Matrix2d): Matrix2d;
}


function apply(matrix: Matrix2d, f: (v: number) => number) {
    return matrix2d(matrix.arr.map(row => {
        return row.map(f)
    }));
}

function layer(weight: number[][], bias: number[][]): Layer {
    return {
        weight: matrix2d(weight),
        bias: matrix2d(bias),
        calcOutput(inputValues: Matrix2d): Matrix2d {
            const prod = product(inputValues, this.weight)
            return apply(add(prod, this.bias), sigmoid)
        }
    }
}

function sigmoid(v: number) {
    return 1 / (1 + Math.pow(Math.E, -v))
}