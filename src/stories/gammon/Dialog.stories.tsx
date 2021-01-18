import React from "react";
import {Meta, Story} from "@storybook/react";
import {Board} from "../../gammon/components/Board";
import {initAbsoluteBoard} from "../../gammon/models/AbsoluteBoardState";
import '../../gammon/components/cubeResponseDialog.css'
import {Dialog, DialogProps} from "../../gammon/components/Dialog";

// this export is required.
export default {
    title: 'Dialog',
    component: Dialog,
    parameters: {}
} as Meta;

const board = {
    status: "",
    board: initAbsoluteBoard(),
    whiteDices: {dices: []},
    redDices: {dices: []},
    whiteScore: 0,
    redScore: 0,
    dispatcher: () => {
    }
}
const Template: Story<DialogProps> = (args) => {

    return (
        <>
            <div className={"boardContainer"}>
                <Board {...{...board}}/>
                <Dialog {...args}/>
            </div>
        </>
    )
}

export const dialogWithBoard = Template.bind({});
dialogWithBoard.args = {
    msgs: ["Dialog message"]
};
export const dialogMultipleLines = Template.bind({});
dialogMultipleLines.args = {
    msgs: ["Dialog message", "next line"]
};
