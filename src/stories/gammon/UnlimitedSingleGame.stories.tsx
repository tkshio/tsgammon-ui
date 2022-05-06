import { Meta, Story } from '@storybook/react'
import { ComponentProps } from 'react'
import { GameStatus } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { UnlimitedSingleGame } from '../../gammon/components/apps/UnlimitedSingleGame'
import {
    bothSGAutoOperator,
    redSGAutoOperator
} from '../../gammon/components/operators/autoOperators'

export default {
    title: 'UnlimitedSingleGame',
    component: UnlimitedSingleGame,
    parameters: {},
} as Meta

const Template: Story<ComponentProps<typeof UnlimitedSingleGame>> = (args) => (
    <UnlimitedSingleGame {...args} />
)

export const initialBoard = Template.bind({})
initialBoard.args = {}

export const cpuPlaysRed = Template.bind({})
cpuPlaysRed.args = {
    sgConfs: {
        autoOperator: redSGAutoOperator(),
    },
}

export const cpuPlaysBoth = Template.bind({})
cpuPlaysBoth.args = {
    sgConfs: {
        autoOperator: bothSGAutoOperator(),
    },
}

export const playDoublet = Template.bind({})
playDoublet.args = {
    state: {
        gameStatus: GameStatus.INPLAY_WHITE,
        dice1: 2,
        dice2: 1,
        absPos: [
            0, 0, 0, 0, 0, 0, -5, /* bar */ -0, -3, 0, 0, 0, 0, -5, 0, 0, 0, 0,
            0, /* bar*/ 0, 3, 0, -2, -2, -2, -1,
        ],
    },
    sgConfs: {},
}
