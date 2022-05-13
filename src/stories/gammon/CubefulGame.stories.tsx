import React from 'react'
import { Meta, Story } from '@storybook/react'

import {
    MoneyGame,
    MoneyGameProps,
} from '../../gammon/components/apps/MoneyGame'

// this export is required.
export default {
    title: 'CubefulGame',
    component: MoneyGame,
    parameters: {},
} as Meta

// straightforward way
// define Story as Story<> object

// default
const Template: Story<MoneyGameProps> = (args) => <MoneyGame {...args} />

export const initialBoard = Template.bind({})
initialBoard.args = {}

export const almostEnd = Template.bind({})
almostEnd.args = {
    state: {
        absPos: [
            0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
            0, 0, 0, 0,
        ],
    },
}
