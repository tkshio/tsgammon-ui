import { Meta, Story } from '@storybook/react'
import { standardConf } from 'tsgammon-core'
import { initAbsoluteBoard } from 'tsgammon-core/AbsoluteBoardState'
import { Board } from '../../gammon/components/boards/Board'
import { Dialog, DialogProps } from '../../gammon/components/uiparts/Dialog'

// this export is required.
export default {
    title: 'Dialog',
    component: Dialog,
    parameters: {},
} as Meta
const board = {
    status: '',
    board: initAbsoluteBoard(standardConf.initialPos),
    whiteDices: { dices: [] },
    redDices: { dices: [] },
    whiteScore: 0,
    redScore: 0,
}
const Template: Story<DialogProps> = (args) => <Dialog {...args} />

export const dialogWithBoard = Template.bind({})
dialogWithBoard.args = {
    msgs: ['Dialog message'],
}
dialogWithBoard.decorators = [
    (Story) => {
        const dialog = <Story />

        return (
            <>
                <Board {...{ ...board, dialog: dialog }} />
            </>
        )
    },
]

export const dialogMultipleLines = Template.bind({})
dialogMultipleLines.args = {
    msgs: ['Dialog message', 'next line'],
}
dialogMultipleLines.decorators = dialogWithBoard.decorators

export const dialogAndOnTheBar = Template.bind({})
dialogAndOnTheBar.args = {
    msgs: ['Dialog message', 'next line'],
}
dialogAndOnTheBar.decorators = [
    (Story) => {
        const dialog = <Story />
        // prettier-ignore
        const boardOnTheBar = {...board, board:initAbsoluteBoard([
        1,
        0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,  0, 0, 0, 0, 0, 0,
        -3        
    ])}
        return (
            <>
                <Board {...{ ...boardOnTheBar, dialog: dialog }} />
            </>
        )
    },
]
