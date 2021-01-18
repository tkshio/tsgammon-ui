import React from 'react';
import {Dices} from "../models/Dices";

import './dice.css';

export type DiceProps = {
    dices: Dices
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
                        <div className={"a"}/>
                        <div className={"b"}/>
                        <div className={"c"}/>
                        <div className={"d"}/>
                        <div className={"e"}/>
                        <div className={"f"}/>
                        <div className={"center"}/>
                    </div>
                );
            })
            }
        </div>
    );
}

