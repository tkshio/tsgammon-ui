import { Meta, Story } from '@storybook/react'
import { ComponentProps } from 'react'
import { UnlimitedMatch } from '../../gammon/components/apps/UnlimitedMatch'
import {
    bothCBAutoOperator,
    bothSGAutoOperator,
    redCBAutoOperator,
    redSGAutoOperator,
    whiteCBAutoOperator,
    whiteSGAutoOperator,
} from '../../gammon/dispatchers/autoOperators'
import { GameStatus } from '../../gammon/dispatchers/utils/GameState'
import { presetDiceSource } from 'tsgammon-core/utils/DiceSource'

export default {
    title: 'UnlimitedMatch',
    component: UnlimitedMatch,
    parameters: {},
} as Meta

const Template: Story<ComponentProps<typeof UnlimitedMatch>> = (args) => (
    <UnlimitedMatch {...args} />
)

export const cpuPlaysRed = Template.bind({})
cpuPlaysRed.args = {
    cbConfs: {
        autoOperator: redCBAutoOperator(),
        sgConfs: { autoOperator: redSGAutoOperator() },
    },
}

export const cpuPlaysWhite = Template.bind({})
cpuPlaysWhite.args = {
    cbConfs: {
        autoOperator: whiteCBAutoOperator(),
        sgConfs: { autoOperator: whiteSGAutoOperator() },
    },
}

export const cpuPlaysBoth = Template.bind({})
cpuPlaysBoth.args = {
    cbConfs: {
        autoOperator: bothCBAutoOperator(),
        sgConfs: { autoOperator: bothSGAutoOperator() },
    },
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
    cbConfs: {
        sgConfs: {
            diceSource,
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
