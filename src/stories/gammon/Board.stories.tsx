import React from "react";
import {Meta, Story} from "@storybook/react";
import {Board, BoardProps} from '../../gammon/components/Board';

import '../../gammon/components/board.css'
import {AbsoluteBoardState, initAbsoluteBoard} from "../../gammon/models/AbsoluteBoardState";
import {cube} from "../../gammon/models/CubeState";
import {dices} from "../../gammon/models/Dices";

// this export is required.
export default {
    title: 'Board',
    component: Board,
    parameters: {}
} as Meta;

// straightforward way
// define Story as Story<> object

const Template: Story<BoardProps> = (args) => <Board {...args} />;

export const initialBoard = Template.bind({});
initialBoard.args = {};


export const manyPieces = Template.bind({})

const diceValue = dices(1, 2)
const cubeProps = {cube: cube(1)}

const board: AbsoluteBoardState = {
    ...initAbsoluteBoard(
        [
            12,
            -2, 0, 8, -3, 0, 5, 2, 2, 2, 2, 2, 2,
            5, 0, 9, -13, 15, -7, -2, -2, -2, 2, -2, 2,
            -13
        ], [3, 4]),
}

manyPieces.args = {
    board: board,
    redDices: {dices: diceValue},
    whiteDices: {dices: diceValue},

    centerCube: cubeProps,
    redCube: cubeProps,
    whiteCube: cubeProps,
}
