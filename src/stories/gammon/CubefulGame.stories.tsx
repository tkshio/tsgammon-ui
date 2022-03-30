import React from "react";
import { Meta, Story } from "@storybook/react";

import { CubefulGame, CubefulGameProps } from "../../gammon/components/apps/CubefulGame";

// this export is required.
export default {
    title: 'CubefulGame',
    component: CubefulGame,
    parameters: {}
} as Meta;

// straightforward way
// define Story as Story<> object

// default
const Template: Story<CubefulGameProps> = (args) => <CubefulGame {...args} />;

export const initialBoard = Template.bind({});
initialBoard.args = {
};

export const almostEnd = Template.bind({});
almostEnd.args = {
    state:{
        absPos: [0,
            0, 0, 0, 0, 0, 0,
            -1, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            1, 0, 0, 0, 0, 0,
            0
        ],
    }
}