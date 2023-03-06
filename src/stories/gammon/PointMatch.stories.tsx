import { Meta, Story } from '@storybook/react'
import { ComponentProps } from 'react'
import { CubeState, DicePip, DiceRoll, score } from 'tsgammon-core'
import { ResignOffer } from 'tsgammon-core/ResignOffer'
import { GameStatus } from 'tsgammon-core/states/utils/GameSetup'
import {
    redCBAutoOperator,
    redSGAutoOperator,
} from '../../gammon/components/operators/autoOperators'
import {
    bothRSAutoOperator,
    redRSAutoOperator,
} from '../../gammon/components/operators/RSAutoOperators'
import { CubefulMatch } from '../../gammon/apps/CubefulMatch'
export default {
    title: 'PointMatch',
    component: CubefulMatch,
    parameters: {
        recordMatch: true,
    },
} as Meta

const Template: Story<ComponentProps<typeof CubefulMatch>> = (args) => (
    <CubefulMatch {...args} />
)

export const cpuPlaysRed3pt = Template.bind({})
cpuPlaysRed3pt.args = {
    matchLength: 3,
    recordMatch: true,
    autoOperators: {
        cb: redCBAutoOperator(),
        sg: redSGAutoOperator(),
        rs: redRSAutoOperator(),
    },
}

const minimalPieces = [
    0, -3, 0, 0, 0, 0, 0, /* bar */ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    /* bar*/ 0, 0, 0, 0, 0, 3, 0,
]
export const endGame3pt = Template.bind({})
endGame3pt.args = {
    matchLength: 3,
    recordMatch: true,
    gameSetup: {
        gameStatus: GameStatus.INPLAY_WHITE,
        dice1: 2,
        dice2: 2,
        absPos: minimalPieces,
    },
}

export const goIntoCrawford = Template.bind({})
goIntoCrawford.args = {
    matchLength: 3,
    recordMatch: true,
    matchScore: score({ redScore: 1, whiteScore: 1 }),
    gameSetup: {
        gameStatus: GameStatus.INPLAY_WHITE,
        dice1: 2,
        dice2: 2,
        absPos: minimalPieces,
    },
    autoOperators: {
        cb: redCBAutoOperator(),
        sg: redSGAutoOperator(),
        rs: redRSAutoOperator(),
    },
}

export const endOfMatch = Template.bind({})
endOfMatch.args = {
    matchLength: 3,
    recordMatch: true,
    matchScore: score({ redScore: 1, whiteScore: 2 }),
    isCrawford: true,
    gameSetup: {
        gameStatus: GameStatus.INPLAY_WHITE,
        dice1: 2,
        dice2: 2,
        absPos: minimalPieces,
    },
    autoOperators: {
        cb: redCBAutoOperator(),
        sg: redSGAutoOperator(),
        rs: redRSAutoOperator(),
    },
}

export const endWithAutoResign = Template.bind({})
endWithAutoResign.args = {
    matchLength: 3,
    recordMatch: true,
    matchScore: score({ redScore: 1, whiteScore: 2 }),
    isCrawford: true,
    gameSetup: {
        gameStatus: GameStatus.TOROLL_WHITE,
        absPos: minimalPieces,
    },
    autoOperators: {
        cb: redCBAutoOperator(),
        sg: redSGAutoOperator(),
        rs: bothRSAutoOperator(
            {
                offerAction: alwaysOffer(ResignOffer.Single),
                offerResponse: alwaysAccept,
            },
            {
                offerAction: alwaysOffer(ResignOffer.Single),
                offerResponse: alwaysAccept,
            }
        ),
    },
}

export const doubletInOpening = Template.bind({})
doubletInOpening.args = {
    recordMatch: true,
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
