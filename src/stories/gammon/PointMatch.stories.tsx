import { Meta, Story } from '@storybook/react'
import { ComponentProps } from 'react'
import { CubeState, DicePip, DiceRoll, score } from 'tsgammon-core'
import { ResignOffer } from 'tsgammon-core/ResignOffer'
import { GameStatus } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { PointMatch } from '../../gammon/components/apps/PointMatch'
import {
    redCBAutoOperator,
    redSGAutoOperator,
} from '../../gammon/components/operators/autoOperators'
import {
    bothRSAutoOperator,
    redRSAutoOperator
} from '../../gammon/components/operators/RSAutoOperators'
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
    matchLength: 3,
    autoOperators: { cb: redCBAutoOperator(), sg: redSGAutoOperator(), rs:redRSAutoOperator() },
}

const minimalPieces = [
    0, -3, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    /* bar*/ 0, 0, 0, 0, 0, 3, 0,
]
export const endGame3pt = Template.bind({})
endGame3pt.args = {
    matchLength: 3,
    board: {
        gameStatus: GameStatus.INPLAY_WHITE,
        dice1: 2,
        dice2: 2,
        absPos: minimalPieces,
    },
}

export const goIntoCrawford = Template.bind({})
goIntoCrawford.args = {
    matchLength: 3,
    matchScore: score({ redScore: 1, whiteScore: 1 }),
    board: {
        gameStatus: GameStatus.INPLAY_WHITE,
        dice1: 2,
        dice2: 2,
        absPos: minimalPieces,
    },
    autoOperators: { cb: redCBAutoOperator(), sg: redSGAutoOperator(), rs:redRSAutoOperator() },
}

export const endOfMatch = Template.bind({})
endOfMatch.args = {
    matchLength: 3,
    matchScore: score({ redScore: 1, whiteScore: 2 }),
    isCrawford: true,
    board: {
        gameStatus: GameStatus.INPLAY_WHITE,
        dice1: 2,
        dice2: 2,
        absPos: minimalPieces,
    },
    autoOperators: { cb: redCBAutoOperator(), sg: redSGAutoOperator() , rs:redRSAutoOperator()},
}

export const endWithAutoResign = Template.bind({})
endWithAutoResign.args = {
    matchLength: 3,
    matchScore: score({ redScore: 1, whiteScore: 2 }),
    isCrawford: true,
    board: {
        gameStatus: GameStatus.TOROLL_WHITE,
        absPos: minimalPieces,
    },
    autoOperators: { cb: redCBAutoOperator(), sg: redSGAutoOperator() , rs:bothRSAutoOperator(
        {
            offerAction:alwaysOffer(ResignOffer.Single),
            offerResponse:alwaysAccept
        },
        {
            offerAction:alwaysOffer(ResignOffer.Single),
            offerResponse:alwaysAccept
        }
    )},
}

export const doubletInOpening = Template.bind({})
doubletInOpening.args = {
    diceSource: {
        roll: doublet,
        openingRoll: () => {
            throw Error()
        },
    },
}

function doublet(): DiceRoll {
    const n = (Math.floor(Math.random() * 6) + 1) as DicePip
    return { dice1: n, dice2: n }
}

function alwaysAccept(_: ResignOffer, doAccept: () => void) {
    doAccept()
    return true
}
function alwaysOffer(resignOffer: ResignOffer) {
    return (
        doOffer: (offer: ResignOffer) => void,
        _: ResignOffer | undefined,
        __: CubeState
    ) => {
        doOffer(resignOffer)
    }
}