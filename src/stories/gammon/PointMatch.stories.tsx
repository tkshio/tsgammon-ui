import { Meta, Story } from '@storybook/react'
import { ComponentProps } from 'react'
import { PointMatch } from '../../gammon/components/apps/PointMatch'
import {
    redCBAutoOperator,
    redSGAutoOperator,
} from '../../gammon/dispatchers/autoOperators'
import { GameStatus } from '../../gammon/dispatchers/utils/GameState'

export default {
    title: 'PointMatch',
    component: PointMatch,
    parameters: {},
} as Meta

const Template: Story<ComponentProps<typeof PointMatch>> = (args) => (
    <PointMatch {...args} />
)

export const cpuPlaysRed3pt = Template.bind({})
cpuPlaysRed3pt.args = {
    matchLength:3,
    cbConfs: {
        autoOperator: redCBAutoOperator(),
        sgConfs: { autoOperator: redSGAutoOperator() },
    },
}


const minimalPieces = [
    0, -3, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    /* bar*/ 0, 0, 0, 0, 0, 3, 0,
]
export const endGame3pt = Template.bind({})
endGame3pt.args = {
    matchLength:3,
    board: {
        gameStatus: GameStatus.INPLAY_WHITE,
        dice1: 2,
        dice2: 2,
        absPos: minimalPieces,
    },
}
