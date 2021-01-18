import {Meta, Story} from "@storybook/react";
import React, {ComponentProps} from "react";
import {PlyRecords} from "../../gammon/components/PlyRecords";
import {GameState, GammonMessage, initialStateBuilder} from "../../gammon/models/GameState";
import {dices} from "../../gammon/models/Dices";
import {score} from "../../gammon/models/Score";
import {PlyRecord} from "../../gammon/models/PlyRecord";
import {reduceForPly} from "../../gammon/components/UseMatchRecord";

export default {
    title: 'PlyRecords',
    component: PlyRecords,
    parameters: {}
} as Meta;

const Template: Story<ComponentProps<typeof PlyRecords>> = (args) => <div style={{display: 'flex', flexFlow: 'row'}}>
    <PlyRecords {...args} /></div>

export const whiteWon = Template.bind({})
whiteWon.args = {
    plyRecords: buildRecords([
            [{type: "StartGame"}], [{type: "Roll", roll: dices(1, 3)}],
            [{type: "Move", pos: 19}, {type: "Move", pos: 17}, {type: "Commit"}],
            [{type: "Double"}],
            [{type: "Take"}],
            [{type: "Roll", roll: dices(1, 3)}],
            [{type: "Move", pos: 6}, {type: "Move", pos: 8}, {type: "Commit"}],
            [{type: "Double"}],
            [{type: "Pass"}],
        ]
    ),
    matchScore: score({whiteScore: 0, redScore: 1}),
    dispatcher: () => {
    }
}
export const redWon = Template.bind({})
redWon.args = {
    plyRecords: buildRecords([
            [{type: "StartGame"}], [{type: "Roll", roll: dices(3, 1)}],
            [{type: "Move", pos: 6}, {type: "Move", pos: 6}, {type: "Commit"}],
            [{type: "Double"}],
            [{type: "Take"}],
            [{type: "Roll", roll: dices(2, 2)}],
            [{type: "Move", pos: 1}, {type: "Move", pos: 1}, {type: "Move", pos: 12}, {
                type: "Move",
                pos: 12
            }, {type: "Commit"}],
            [{type: "Double"}],
            [{type: "Pass"}],
        ]
    ),
    matchScore: score({whiteScore: 0, redScore: 1}),
    dispatcher: () => {
    }
}


export const whiteFirstRedWon = Template.bind({})
whiteFirstRedWon.args = {
    plyRecords: buildRecords([
            [{type: "StartGame"}], [{type: "Roll", roll: dices(1, 3)}],
            [{type: "Move", pos: 19}, {type: "Move", pos: 17}, {type: "Commit"}],
            [{type: "Double"}],
            [{type: "Take"}],
            [{type: "Roll", roll: dices(2, 2)}],
            [{type: "Commit", force: true}],
            [{type: "AwaitRoll"}, {type: "Roll", roll: dices(3, 1)}],
            [{type: "Commit", force: true}],
            [{type: "AwaitRoll"}, {type: "Roll", roll: dices(3, 1)}],
            [{type: "Commit", force: true}],
            [{type: "Double"}],
            [{type: "Take"}],
            [{type: "Roll", roll: dices(2, 2)}],
            [{type: "Commit", force: true}],
            [{type: "Double"}],
            [{type: "Pass"}],
        ]
    ),
    matchScore: score({whiteScore: 0, redScore: 1}),
    dispatcher: () => {
    }
}
export const redFirstWhiteWon = Template.bind({})
redFirstWhiteWon.args = {
    plyRecords: buildRecords([
            [{type: "StartGame"}], [{type: "Roll", roll: dices(3, 1)}],
            [{type: "Move", pos: 6}, {type: "Move", pos: 6}, {type: "Commit"}],
            [{type: "Double"}],
            [{type: "Pass"}],
        ]
    ),
    matchScore: score({whiteScore: 0, redScore: 1}),
    dispatcher: () => {
    }
}


export const emptyRecords = Template.bind({})
emptyRecords.args = {
    plyRecords: [],
    dispatcher: () => {
    }
}

function buildRecords(msgsList: GammonMessage[][]): PlyRecord[] {
    const initRecord: { state: GameState, recs: PlyRecord[] }
        = {state: initialStateBuilder.buildOpeningStatus(), recs: []}
    const msgs = msgsList.flat()
    const records = msgs.reduce(
        (records, message): { state: GameState, recs: PlyRecord[] } => {
            const state = records.state
            const [nextState, , plys] = reduceForPly(state, message)
            if (plys) {
                return {state: nextState, recs: records.recs.concat(plys)}
            }
            return {state: nextState, recs: records.recs}
        }, initRecord)
    return records.recs
}
