import { Meta, Story } from '@storybook/react'
import { ComponentProps } from 'react'
import { GameStatus } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'
import { PointMatch } from '../../gammon/components/apps/PointMatch'
import {
    bothCBAutoOperator,
    bothSGAutoOperator,
    redCBAutoOperator,
    redSGAutoOperator,
    whiteCBAutoOperator,
    whiteSGAutoOperator,
} from '../../gammon/components/operators/autoOperators'

export default {
    title: 'UnlimitedMatch',
    component: PointMatch,
    parameters: {},
} as Meta

const Template: Story<ComponentProps<typeof PointMatch>> = (args) => (
    <PointMatch {...args} />
)

export const cpuPlaysRed = Template.bind({})
cpuPlaysRed.args = {
    autoOperator: { cb: redCBAutoOperator(), sg: redSGAutoOperator() },
}

export const cpuPlaysWhite = Template.bind({})
cpuPlaysWhite.args = {
    autoOperator: { cb: whiteCBAutoOperator(), sg: whiteSGAutoOperator() },
}

export const cpuPlaysBoth = Template.bind({})
cpuPlaysBoth.args = {
    autoOperator: { cb: bothCBAutoOperator(), sg: bothSGAutoOperator() },
}

export const gameFromMidst = Template.bind({})
const diceSource = presetDiceSource(1, 4, 2, 3)
gameFromMidst.args = {
    board: {
        gameStatus: GameStatus.INPLAY_RED,
        dice1: 1,
        dice2: 2,
        absPos: [
            0, 2, 0, 0, 0, 0, -5, /* bar */ -0, -3, 0, 0, 0, 5, -5, 0, 0, 0, 3,
            0, /* bar*/ 5, 0, 0, 0, 0, -1, -1,
        ],
    },
    diceSource,
    cbConfs: {
        sgConfs: {
        },
    },
}

const minimalPieces = [
    0, -3, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    /* bar*/ 0, 0, 0, 0, 0, 3, 0,
]
export const endGame = Template.bind({})
endGame.args = {
    board: {
        gameStatus: GameStatus.INPLAY_WHITE,
        dice1: 2,
        dice2: 2,
        absPos: minimalPieces,
    },
}
