import { simpleNNEngine } from "tsgammon-core/engines/SimpleNNGammon"
import { score } from "tsgammon-core/Score"
// import { formatPly } from "../../models/utils/formatPly"
import { formatStake } from "tsgammon-core/utils/formatStake"
import { cubefulSGListener } from "../../dispatchers/cubefulSGListener"
import { cubeGameDispatcher, CubeGameDispatcher, setStateListener as setCBStateListener } from "../../dispatchers/CubeGameDispatcher"
import { CBState } from "../../dispatchers/CubeGameState"
import { setStateListener, singleGameDispatcher, SingleGameListeners } from "../../dispatchers/SingleGameDispatcher"
import { SGState } from "../../dispatchers/SingleGameState"
import { toCBState, toSGState } from "../../dispatchers/utils/GameState"
import { doPlay as doCheckerPlay } from "./RunAutoMatchWithDispatcher"

test('run 3 games(with CBDispatcher)', () => {
    let gameScore = score()

    let sgStateBox: SGState[] = [toSGState()]
    let cbStateBox: CBState[] = [toCBState()]

    const setSGState = (state: SGState) => { sgStateBox[0] = state }
    const setCBState = (state: CBState) => { cbStateBox[0] = state }

    const cbDispatcher = cubeGameDispatcher(setCBStateListener(setCBState))
    const sgListener = setStateListener(setSGState)
    
    for (let i = 0; i < 3; i++) {
        let cbState = cbStateBox[0]
        let sgState = sgStateBox[0]

        while (cbState.tag !== "CBEoG") {
            doPlay(cbState, cbDispatcher, sgState, sgListener)

            cbState = cbStateBox[0]
            sgState = sgStateBox[0]
        }
        // console.log(formatPly(sgState.lastState().curPly))
        gameScore = gameScore.add(cbState.stake)
        console.log(formatStake(cbState.stake, cbState.eogStatus))
        sgStateBox[0] = toSGState()
    }
    console.log(`Result: red ${gameScore.redScore} - white ${gameScore.whiteScore}`)
})

const engine = simpleNNEngine

function doPlay(cbState: CBState, cbDispatcher: CubeGameDispatcher, sgState: SGState, sgListeners: SingleGameListeners) {
    const sgDispatcher = singleGameDispatcher(cubefulSGListener(sgListeners, cbState, cbDispatcher))

    switch (cbState.tag) {
        case "CBOpening":
        case "CBInPlay":
        case "CBToRoll":
            doCheckerPlay(simpleNNEngine, sgState, sgDispatcher)
            break;

        case "CBAction":
            if (sgState.tag === "SGToRoll") {
                if (engine.cubeAction(sgState.boardState, cbState.cubeState).isDouble) {
                    cbDispatcher.doDouble(cbState)
                } else {
                    cbDispatcher.doSkipCubeAction(cbState)
                }
            } else {
                throw new Error("Unexpected sgState for cube action: sgState=" + sgState.tag)
            }
            break;

        case "CBResponse":
            if (sgState.tag === "SGToRoll") {
                if (engine.cubeResponse(sgState.boardState, cbState.cubeState).isTake) {
                    cbDispatcher.doTake(cbState)
                } else {
                    cbDispatcher.doPass(cbState)
                }
            } else {
                throw new Error("Unexpected sgState for cube response: sgState=" + sgState.tag)
            }
            break;

        case "CBEoG":
            break;
    }
}

