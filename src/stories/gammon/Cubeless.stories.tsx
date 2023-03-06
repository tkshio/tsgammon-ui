import { Meta, Story } from '@storybook/react'
import { ComponentProps } from 'react'
import { GameStatus } from 'tsgammon-core/states/utils/GameSetup'
import { Cubeless } from '../../gammon/apps/Cubeless'
import {
    bothSGAutoOperator,
    redSGAutoOperator,
} from '../../gammon/components/operators/autoOperators'
import { DiceSource, rollMathRandom } from 'tsgammon-core/utils/DiceSource'
import { DiceRoll } from 'tsgammon-core'
export default {
    title: 'Cubeless',
    component: Cubeless,
    parameters: {},
} as Meta

const Template: Story<ComponentProps<typeof Cubeless>> = (args) => (
    <Cubeless {...args} />
)

export const initialBoard = Template.bind({})
initialBoard.args = {}

export const cpuPlaysRed = Template.bind({})
cpuPlaysRed.args = {
    autoOperators: { sg: redSGAutoOperator() },
}

export const cpuPlaysBoth = Template.bind({})
cpuPlaysBoth.args = {
    autoOperators: { sg: bothSGAutoOperator() },
}

export const playDoublet = Template.bind({})
const rollDoublet: () => DiceRoll = () => {
    const roll = rollMathRandom()
    return { dice1: roll, dice2: roll }
}
const diceSource: DiceSource = { roll: rollDoublet, openingRoll: rollDoublet }
playDoublet.args = {
    diceSource,
    gameSetup: {
        gameStatus: GameStatus.INPLAY_WHITE,
        dice1: 2,
        dice2: 1,
        absPos: [
            0, 0, 0, 0, 0, 0, -5, /* bar */ -0, -3, 0, 0, 0, 0, -5, 0, 0, 0, 0,
            0, /* bar*/ 0, 3, 0, -2, -2, -2, -1,
        ],
    },
}
