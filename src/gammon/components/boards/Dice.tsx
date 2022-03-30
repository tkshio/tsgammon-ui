import React from 'react';
import { Dice as DiceState } from "tsgammon-core/Dices";

import './dice.css';

export type BlankDice = { pip: 0, used: false }
export const blankDice: BlankDice = { pip: 0, used: false }
export const blankDices: BlankDice[] = [blankDice, blankDice]

export type DiceProps = {
    dices: (DiceState | BlankDice)[]
};

/**
 * ダイス（１つまたは複数）を描画するコンポーネント
 * @param props 各ダイスについて、目（pip)と、使用状態(used)を指定できる。目に0を指定すると、空白ダイスになる。
 * @constructor
 */
export function Dice(props: DiceProps) {
    return (
        <div className={"dice"}>
            {props.dices.map((dice, index) => {
                return (
                    <div className={"pip d" + dice.pip + (dice.used ? " used" : "")} key={index.toString()}>
                        <div className={"a"} />
                        <div className={"b"} />
                        <div className={"c"} />
                        <div className={"d"} />
                        <div className={"e"} />
                        <div className={"f"} />
                        <div className={"center"} />
                    </div>
                );
            })}
        </div>
    );
}

