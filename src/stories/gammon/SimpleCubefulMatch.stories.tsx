import React from 'react'
import { Meta, Story } from '@storybook/react'

import {
    SimpleCubefulMatch,
    SimpleCubefulMatchProps,
} from '../../gammon/apps/SimpleCubefulMatch'

// this export is required.
export default {
    title: 'SimpleCubefulMatch',
    component: SimpleCubefulMatch,
    parameters: {},
} as Meta

// straightforward way
// define Story as Story<> object

// default
const Template: Story<SimpleCubefulMatchProps> = (args) => (
    <SimpleCubefulMatch {...args} />
)

export const initialBoard = Template.bind({})
initialBoard.args = {}

export const almostEnd = Template.bind({})
almostEnd.args = {
    gameSetup: {
        absPos: [
            0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
            0, 0, 0, 0,
        ],
    },
}
