import { Meta, Story } from '@storybook/react'
import { ComponentProps } from 'react'
import {
    absoluteMovesRed,
    absoluteMovesWhite,
} from 'tsgammon-core/AbsoluteMove'
import { PlyRecordInPlay } from 'tsgammon-core/records/PlyRecord'
import { score } from 'tsgammon-core/Score'
import { PlyRecords } from '../../gammon/components/recordedGames/PlyRecords'

export default {
    title: 'PlyRecords',
    component: PlyRecords,
    parameters: {},
} as Meta

const Template: Story<ComponentProps<typeof PlyRecords>> = (args) => (
    <div style={{ display: 'flex', flexFlow: 'row' }}>
        <PlyRecords {...args} />
    </div>
)

export const whiteWon = Template.bind({})
const plyRecordsWhiteWon: PlyRecordInPlay[] = [
    {
        tag: 'Commit',
        ply: {
            moves: absoluteMovesWhite([
                { from: 19, to: 20 },
                { from: 19, to: 23 },
            ]),
            dices: [1, 3],
        },
        isRed: false,
    },
    { tag: 'Double', cubeValue: 2, isRed: true },
    { tag: 'Take', isRed: false },
    {
        tag: 'Commit',
        ply: {
            moves: absoluteMovesRed([
                { from: 19, to: 20 },
                { from: 19, to: 23 },
            ]),
            dices: [1, 3],
        },
        isRed: true,
    },
    { tag: 'Double', cubeValue: 4, isRed: false },
    { tag: 'Pass', isRed: true },
]

whiteWon.args = {
    playersConf: { red: { name: 'red' }, white: { name: 'white' } },
    plyRecords: plyRecordsWhiteWon.map((plyRecord: PlyRecordInPlay) => ({
        plyRecord,
        state: undefined,
    })),
    matchScore: score({ whiteScore: 0, redScore: 1 }),
    dispatcher: () => {
        //
    },
}
export const redWon = Template.bind({})
redWon.args = {
    playersConf: { red: { name: 'red' }, white: { name: 'white' } },
    plyRecords: whiteWon.args.plyRecords?.map((plyState) => ({
        ...plyState,
        plyRecord: { ...plyState.plyRecord, isRed: !plyState.plyRecord.isRed },
    })),
    matchScore: score({ whiteScore: 0, redScore: 1 }),
    dispatcher: () => {
        //
    },
}

const plyRecordsWhiteFirst: PlyRecordInPlay[] = [
    {
        tag: 'Commit',
        ply: {
            moves: absoluteMovesWhite([
                { from: 19, to: 20 },
                { from: 19, to: 23 },
            ]),
            dices: [1, 3],
        },
        isRed: false,
    },
    { tag: 'Double', cubeValue: 2, isRed: true },
    { tag: 'Take', isRed: false },
    {
        tag: 'Commit',
        ply: {
            moves: absoluteMovesRed([
                { from: 19, to: 20 },
                { from: 19, to: 23 },
            ]),
            dices: [1, 3],
        },
        isRed: true,
    },
]
export const whiteFirstRedWon = Template.bind({})
whiteFirstRedWon.args = {
    playersConf: { red: { name: 'red' }, white: { name: 'white' } },
    plyRecords: plyRecordsWhiteFirst.map((plyRecord) => ({
        plyRecord,
        state: undefined,
    })),
    matchScore: score({ whiteScore: 0, redScore: 1 }),
    dispatcher: () => {
        //
    },
}
const plyRecordsRedFirst: PlyRecordInPlay[] = [
    {
        tag: 'Commit',
        ply: {
            moves: absoluteMovesWhite([
                { from: 19, to: 20 },
                { from: 19, to: 23 },
            ]),
            dices: [1, 3],
        },
        isRed: true,
    },
    { tag: 'Double', cubeValue: 2, isRed: false },
    { tag: 'Pass', isRed: true },
]
export const redFirstWhiteWon = Template.bind({})
redFirstWhiteWon.args = {
    playersConf: { red: { name: 'red' }, white: { name: 'white' } },
    plyRecords: plyRecordsRedFirst.map((plyRecord) => ({
        plyRecord,
        state: undefined,
    })),
    matchScore: score({ whiteScore: 0, redScore: 1 }),
    dispatcher: () => {
        //
    },
}

export const emptyRecords = Template.bind({})
emptyRecords.args = {
    playersConf: { red: { name: 'red' }, white: { name: 'white' } },
    plyRecords: [],
    dispatcher: () => {
        //
    },
}
