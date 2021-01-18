import React from "react";
import {GammonMessage} from "../models/GameState";

import './revertButton.css'

interface RevertButtonProps {
    dispatcher: (messages: GammonMessage[]) => void
}

/**
 * やり直しボタンを描画するコンポーネント
 * @param prop
 * @constructor
 */
export function RevertButton(prop: RevertButtonProps) {
    return (
        <div className={"revertButton"} onClick={() => {
            prop.dispatcher([{type: "Revert"}]);
        }}/>
    )
}