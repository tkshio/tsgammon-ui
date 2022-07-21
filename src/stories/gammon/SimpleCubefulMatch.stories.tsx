import React from 'react'
import { Meta, Story } from '@storybook/react'

import {
    SimpleCubefulMatch,
    SimpleCubefulMatchProps,
} from '../../gammon/components/apps/SimpleCubefulMatch'

// this export is required.
export default {
    title: 'SimpleCubefulMatch',
    component: SimpleCubefulMatch,
    parameters: {},
} as Meta

// straightforward way
// define Story as Story<> object

// default
const Template: Story<SimpleCubefulMatchProps> = (args) => <SimpleCubefulMatch {...args} />

export const initialBoard = Template.bind({})
initialBoard.args = {}

export const almostEnd = Template.bind({})
almostEnd.args = {
    setup: {
        absPos: [
            0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
            0, 0, 0, 0,
        ],
    },
}
