import {Meta, Story} from "@storybook/react";
import React, {ComponentProps} from "react";
import {UnlimitedMatch} from "../../gammon/components/UnlimitedMatch";
import {initialStateBuilder, standardConf} from "../../gammon/models/GameState";
import {
    bothSideAutoOperator,
    bothSideBoardOperator,
    whiteSideAutoOperator,
    whiteSideBoardOperator
} from "../../gammon/models/GameOperators";
import {presetDiceSource} from "../../gammon/models/DiceSource";
import {dicePip} from "../../gammon/models/Dices";
import {randomEngine} from "../../gammon/engines/GammonEngine";

export default {
    title: 'UnlimitedMatch',
    component: UnlimitedMatch,
    parameters: {}
} as Meta;

// straightforward way
// define Story as Story<> object

const Template: Story<ComponentProps<typeof UnlimitedMatch>> = (args) => <UnlimitedMatch {...args}/>

export const operateWhite = Template.bind({})
operateWhite.args = {}

export const operateBoth = Template.bind({})
operateBoth.args = {
    boardOperator: bothSideBoardOperator(),
    autoOperator: bothSideAutoOperator()
}


export const gameFromMidst = Template.bind({})
const src = presetDiceSource(1, 4, 2, 3)
gameFromMidst.args = {
    initialState: initialStateBuilder.buildCheckerPlayStatus(
        dicePip(1), dicePip(2),
        standardConf,
        [0,
            2, 0, 0, 0, 0, -5,/* bar */-0, -3, 0, 0, 0, 5,
            -5, 0, 0, 0, 3, 0,/* bar*/5, 0, 0, 0, 0, -1,
            -1],
        undefined, false
    ),
    boardOperator: whiteSideBoardOperator(src),
    autoOperator: whiteSideAutoOperator(randomEngine(), src),
}

const minimalPieces = [0,
    -3, 0, 0, 0, 0, 0,/* bar */0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,/* bar*/0, 0, 0, 0, 0, 3,
    0]
export const endGame = Template.bind({})
endGame.args = {
    initialState: initialStateBuilder.buildCheckerPlayStatus(
        dicePip(1), dicePip(2),
        {...standardConf, initialArrangement: minimalPieces},
        minimalPieces,
        undefined, false
    ),
    boardOperator: whiteSideBoardOperator(src),
    autoOperator: whiteSideAutoOperator(randomEngine(), src),
}


