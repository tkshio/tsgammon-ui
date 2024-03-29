import { Meta, Story } from '@storybook/react'
import React from 'react'
import { initAbsoluteBoard } from 'tsgammon-core/AbsoluteBoardState'
import { Board, BoardProps } from '../../gammon/components/boards/Board'
import { CubeResponseDialog } from '../../gammon/components/uiparts/CubeResponseDialog'

// this export is required.
export default {
    title: 'CubeResponseDialog',
    component: CubeResponseDialog,
    parameters: {},
} as Meta

const board = {
    status: '',
    board: initAbsoluteBoard(),
    redDices: { dices: [] },
    whiteDices: { dices: [] },
    whiteScore: 0,
    redScore: 0,
    dialog: (
        <CubeResponseDialog
            onTake={() => {
                //
            }}
            onPass={() => {
                //
            }}
        />
    ),
}

const Template: Story<BoardProps> = () => (
    <>
        <Board {...board} />
    </>
)
export const dialogWithBoard = Template.bind({})
dialogWithBoard.args = {}
