import { Meta, Story } from '@storybook/react'
import React from 'react'
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
    board: initAbsoluteBoard(),
    whiteDices: { dices: [] },
    redDices: { dices: [] },
    whiteScore: 0,
    redScore: 0,
}
const Template: Story<DialogProps> = (args) => {
    return (
        <>
            <div className={'boardContainer'}>
                <Board {...{ ...board }} />
                <Dialog {...args} />
            </div>
        </>
    )
}

export const dialogWithBoard = Template.bind({})
dialogWithBoard.args = {
    msgs: ['Dialog message'],
}
export const dialogMultipleLines = Template.bind({})
dialogMultipleLines.args = {
    msgs: ['Dialog message', 'next line'],
}
