import { GammonEngine } from "tsgammon-core/engines/GammonEngine"
import { simpleNNEngine } from "tsgammon-core/engines/SimpleNNGammon"
import { score } from "tsgammon-core/Score"
import { randomDiceSource } from "tsgammon-core/utils/DiceSource"
// import { formatPly } from "tsgammon-core/utils/formatPly"
import { formatStake } from "tsgammon-core/utils/formatStake"
import { setStateListener, SingleGameDispatcher, singleGameDispatcher } from "../../dispatchers/SingleGameDispatcher"
import { SGState } from "../../dispatchers/SingleGameState"
import { toSGState } from "../../dispatchers/utils/GameState"

test('run 3 games(with SGDispatcher)', () => {
    let sgStateBox: SGState[] = [toSGState()]
    let gameScore = score()
    const setSGState = (state: SGState) => { sgStateBox[0] = state }
    const sgDispatcher = singleGameDispatcher(setStateListener(setSGState))

    for (let i = 0; i < 3; i++) {
        let sgState = sgStateBox[0]
        
        while (sgState.tag !== "SGEoG") {
            doPlay(simpleNNEngine, sgState, sgDispatcher)
            if (sgState.tag === "SGToRoll") {
                // console.log(formatPly(sgState.lastPly))
            }
            sgState = sgStateBox[0]
        }
        // console.log(formatPly(sgState.lastState().curPly))
        gameScore = gameScore.add(sgState.stake)
        console.log(formatStake(sgState.stake, sgState.eogStatus))
        sgStateBox[0] = toSGState()
    }
    console.log(`Result: red ${gameScore.redScore} - white ${gameScore.whiteScore}`)
})

const diceSource = randomDiceSource

export function doPlay(engine:GammonEngine, sgState: SGState, sgDispatcher:SingleGameDispatcher) {
    switch (sgState.tag) {
        case "SGOpening":
            const openingRoll = diceSource.roll()
            sgDispatcher.doOpeningRoll(sgState, openingRoll)
            break;
        case "SGInPlay":
            const curNode = sgState.boardStateNode
            const nextNode = engine.checkerPlay(curNode)
            sgDispatcher.doCommitCheckerPlay(sgState, nextNode)
            break;
        case "SGToRoll":
            const roll = diceSource.roll()
            sgDispatcher.doRoll(sgState, roll)
            break;
        case "SGEoG":
            break;
    }
}
