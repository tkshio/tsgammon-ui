import { Meta, Story } from '@storybook/react'
import React from 'react'
import { dices } from 'tsgammon-core/Dices'
import { blankDice, Dice, DiceProps } from '../../gammon/components/boards/Dice'

const decolator =
    (color = 'white', pipColor?: string) =>
    (Story: Story) => {
        const style = {
            border: '0 solid black',
            '--diceSize': '48px',
            '--diceColor': color,
            '--dicePipColor': pipColor,
        }

        return (
            <div style={style}>
                <Story />
            </div>
        )
    }

export default {
    title: 'Dice',
    component: Dice,
    parameters: {},
    decorators: [decolator()],
} as Meta

// straightforward way
// define Story as Story<> object

const Template: Story<DiceProps> = (args) => {
    return <Dice {...args} />
}

export const singleDice = Template.bind({})
singleDice.args = { dices: dices(5) }

export const coloredDice = Template.bind({})
coloredDice.args = { dices: dices(5) }
coloredDice.decorators = [decolator('red', 'white')]

const ListTemplate: Story<{ items: DiceProps[] }> = ({ items }) => (
    <div>
        {items.map((item, index) => (
            <Dice key={index} {...item} />
        ))}
    </div>
)

export const diceSet = ListTemplate.bind({})
diceSet.args = {
    items: [
        { dices: [] },
        { dices: [blankDice, ...dices(1, 2, 3, 4, 5, 6)] },
        { dices: dices(1) },
        { dices: dices(2, 3) },
        { dices: dices(4, 5, 6) },
    ],
}
