import React from 'react';
import {GammonMessage} from "../models/GameState";
import "./button.css"
import "./cubeResponseDialog.css"

export type CubeResponseDialogProps = {
    dispatcher: (messages: GammonMessage[]) => void
};

/**
 * キューブレスポンスのための、すなわちTake/Passのみを指定可能なダイアログを表示する
 * @param props.dispatcher 指定されたGammonMessageを受け取るdispatcher
 * @constructor
 */
export function CubeResponseDialog(props: CubeResponseDialogProps) {
    return (
        <div className={"dialogContainer"}>
            <div className={"dialog cubeResponse"}>
                <div className={"caption"}/>
                <div className={"buttons"}>
                    <div className={"button take"}
                         onClick={() => props.dispatcher([{type: "Take"}])}>
                    </div>
                    <div className={"button pass"}
                         onClick={() => props.dispatcher([{type: "Pass"}])}>
                    </div>
                </div>
            </div>
        </div>
    )
}