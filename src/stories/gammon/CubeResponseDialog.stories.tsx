import React from "react";
import {Meta, Story} from "@storybook/react";
import {CubeResponseDialog} from "../../gammon/components/CubeResponseDialog";
import {Board, BoardProps} from "../../gammon/components/Board";
import {initAbsoluteBoard} from "../../gammon/models/AbsoluteBoardState";
import '../../gammon/components/cubeResponseDialog.css'

// this export is required.
export default {
    title: 'CubeResponseDialog',
    component: CubeResponseDialog,
    parameters: {}
} as Meta;

const board = {
    status: "",
    board: initAbsoluteBoard(),
    redDices: {dices: []},
    whiteDices: {dices: []},
    whiteScore: 0,
    redScore: 0,
    dispatcher: () => {
    }
}

const Template: Story<BoardProps> = (args) =>
    (
        <>
            <div className={"boardContainer"}>
                <Board {...board}/>
                <CubeResponseDialog dispatcher={() => {
                }}/>
            </div>
        </>
    )
export const dialogWithBoard = Template.bind({});
dialogWithBoard.args = {
    dispatcher: () => {
    }
};
