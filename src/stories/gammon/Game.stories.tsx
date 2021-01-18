import React, {ComponentProps} from "react";
import {Meta, Story} from "@storybook/react";
import {Game} from '../../gammon/components/Game';
import {bothSideAutoOperator, bothSideBoardOperator} from "../../gammon/models/GameOperators";
import {initialStateBuilder, standardConf, stateBuilder} from "../../gammon/models/GameState";
import {cube} from "../../gammon/models/CubeState";
import {presetDiceSource} from "../../gammon/models/DiceSource";
import {dicePip} from "../../gammon/models/Dices";
import {score} from "../../gammon/models/Score";
import {eog} from "../../gammon/models/BoardState";

export default {
    title: 'Game',
    component: Game,
    parameters: {}
} as Meta;

// straightforward way
// define Story as Story<> object

const Template: Story<ComponentProps<typeof Game>> = (args) => <Game {...args}/>
export const operateBoth = Template.bind({})
operateBoth.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator()
}

export const operateWhite = Template.bind({})
operateWhite.args = {}

export const endGame = Template.bind({})
endGame.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator(),
    initialState: stateBuilder.initGameState(standardConf,
        [
            0,
            -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3,
            0
        ])
}

export const blocked = Template.bind({})
blocked.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator(),
    initialState: stateBuilder.initGameState(standardConf,
        [
            1,
            -2, -2, -2, -2, -2, -2, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 2,
            -1
        ])
}
export const noCube = Template.bind({})
noCube.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator(),
    initialState: stateBuilder.initGameState({
        ...standardConf,
        cubeMax: 1
    })
}

export const checkerPlayWhite = Template.bind({})
checkerPlayWhite.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator(),
    initialState: initialStateBuilder.buildCheckerPlayStatus(
        dicePip(2), dicePip(3),
        standardConf,
    )
}
export const cubeResponseRed = Template.bind({})
cubeResponseRed.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator(),
    initialState: initialStateBuilder.buildCubeResponseStatus(cube(2, undefined, 512), undefined, undefined, false)
}

export const cubeActionWhite = Template.bind({})
cubeActionWhite.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator(),
    initialState: initialStateBuilder.buildCubeActionStatus()
}

export const endOfGameRed = Template.bind({})

endOfGameRed.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator(),
    initialState: initialStateBuilder.buildEndOfGameStatus(standardConf, undefined, undefined, score({redScore: 2}), eog({isGammon: true})),
    initialScore: score({redScore: 2})
}
export const endOfGameBackgammon = Template.bind({})

endOfGameBackgammon.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator(),
    initialState: initialStateBuilder.buildEndOfGameStatus(standardConf, undefined, undefined, score({redScore: 3}), eog({isBackgammon: true})),
    initialScore: score({redScore: 3})
}

export const opening = Template.bind({})
opening.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator(),
    initialState: initialStateBuilder.buildOpeningStatus(standardConf, undefined, undefined)
}

export const presetDices = Template.bind({})
const diceSource = presetDiceSource(1, 2, 3, 4, 5, 6)
presetDices.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator(diceSource),
    initialState: initialStateBuilder.buildOpeningStatus(standardConf, undefined, undefined)
}
