import {Dices} from "./Dices";

/**
 * 盤面上で可能な操作の種類
 */
export enum BoardActionType {
    "Cube" = 1, "Dice", "Point"
}

/**
 * 盤面上で可能な操作を表現した型
 *
 * キューブとダイスは触れる動作の表現なので、引数はない
 */
export type BoardAction =
    { type: BoardActionType.Cube } |
    { type: BoardActionType.Dice } |
    {
        type: BoardActionType.Point
        pos: number
        dices: Dices
    }
