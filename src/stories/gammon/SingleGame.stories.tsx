import { Meta, Story } from "@storybook/react";
import { SingleGame, SingleGameProps } from '../../gammon/components/apps/SingleGame';
import { bothSGAutoOperator, redSGAutoOperator } from "../../gammon/dispatchers/autoOperators";
import { GameStatus } from "../../gammon/dispatchers/utils/GameState";
import { GammonEngine, simpleEvalEngine } from "tsgammon-core/engines/GammonEngine";
import { evaluate } from "tsgammon-core/engines/SimpleNNGammon";
import { BoardState } from "tsgammon-core/BoardState";
import { DicePip, DiceRoll } from "tsgammon-core/Dices";
import { presetDiceSource } from "tsgammon-core/utils/DiceSource";


// this export is required.
export default {
    title: 'SingleGame',
    component: SingleGame,
    parameters: {}
} as Meta;

// straightforward way
// define Story as Story<> object

// default
const Template: Story<SingleGameProps> = (args) => <SingleGame {...args} />;

export const initialBoard = Template.bind({});
initialBoard.args = {};

const engine: GammonEngine = simpleEvalEngine((board: BoardState) => evaluate(board).e)

export const cpuPlaysRed = Template.bind({});
cpuPlaysRed.args = {
    sgConfs: {
        autoOperator: redSGAutoOperator(engine)
    }
};
export const cpuPlaysBoth = Template.bind({});
cpuPlaysBoth.args = {
    sgConfs: {
        autoOperator: bothSGAutoOperator(engine)
    }
};

export const doubletInOpening = Template.bind({});
doubletInOpening.args = {
    sgConfs: {
        diceSource: {
            roll: doublet,
            openingRoll: () => {
                throw Error()
            }
        }
    }
};

function doublet(): DiceRoll {
    const n = (Math.floor(Math.random() * 6) + 1) as DicePip;
    return { dice1: n, dice2: n }
}

export const almostEndOfGame = Template.bind({});
almostEndOfGame.args = {
    absPos:
        [0,
            0, 0, 0, 0, 0, 0,
            -5, -5, -5, 0, 0, 0,
            0, 0, 0, 0, 0, 0,
            0, 0, 0, 1, 0, 0,
            0

        ],
    dice1: 1,
    dice2: 2,
    gameStatus: GameStatus.INPLAY_WHITE
}

export const asymmetryc = Template.bind({});
asymmetryc.args = {
    absPos: [0,
        0, -2, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 14, 1, 0, 0,
        0

    ],
    gameStatus: GameStatus.OPENING,
    sgConfs: {
        diceSource: presetDiceSource(6, 2)
    }
}

export const blocked = Template.bind({});
blocked.args = {
    absPos: [0,
        0, -2, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0,
        0, 0, 1, 0, 0, -2,
        0

    ],
    dice1: 1,
    dice2: 2,
    gameStatus: GameStatus.INPLAY_WHITE,
    sgConfs: {
        diceSource: presetDiceSource(6, 2)
    }
}