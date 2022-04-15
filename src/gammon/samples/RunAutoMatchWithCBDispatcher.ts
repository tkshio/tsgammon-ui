import { simpleNNEngine } from 'tsgammon-core/engines/SimpleNNGammon'
import { score } from 'tsgammon-core/Score'
import { formatStake } from 'tsgammon-core/utils/formatStake'
import { cubefulSGListener } from '../dispatchers/cubefulSGListener'
import {
    cubeGameDispatcher,
    CubeGameDispatcher,
    setCBStateListener ,
} from '../dispatchers/CubeGameDispatcher'
import { CBState } from '../dispatchers/CubeGameState'
import {
    setSGStateListener,
    singleGameDispatcher,
    SingleGameListeners,
} from '../dispatchers/SingleGameDispatcher'
import { SGState } from '../dispatchers/SingleGameState'
import { toCBState, toSGState } from '../dispatchers/utils/GameState'
import { doPlay as doCheckerPlay } from './doPlay'

const engine = simpleNNEngine

function doPlay(
    cbState: CBState,
    cbDispatcher: CubeGameDispatcher,
    sgState: SGState,
    sgListeners: SingleGameListeners
) {
    const sgDispatcher = singleGameDispatcher(
        cubefulSGListener(sgListeners, cbState, cbDispatcher)
    )

    switch (cbState.tag) {
        case 'CBOpening':
        case 'CBInPlay':
        case 'CBToRoll':
            doCheckerPlay(simpleNNEngine, sgState, sgDispatcher)
            break

        case 'CBAction':
            if (sgState.tag === 'SGToRoll') {
                if (
                    engine.cubeAction(sgState.boardState, cbState.cubeState)
                        .isDouble
                ) {
                    cbDispatcher.doDouble(cbState)
                } else {
                    cbDispatcher.doSkipCubeAction(cbState)
                }
            } else {
                throw new Error(
                    'Unexpected sgState for cube action: sgState=' + sgState.tag
                )
            }
            break

        case 'CBResponse':
            if (sgState.tag === 'SGToRoll') {
                if (
                    engine.cubeResponse(sgState.boardState, cbState.cubeState)
                        .isTake
                ) {
                    cbDispatcher.doTake(cbState)
                } else {
                    cbDispatcher.doPass(cbState)
                }
            } else {
                throw new Error(
                    'Unexpected sgState for cube response: sgState=' +
                        sgState.tag
                )
            }
            break

        case 'CBEoG':
            break
    }
}
function run() {
    let gameScore = score()
    const gState = { cb: toCBState(), sg: toSGState() }

    const setSGState = (state: SGState) => {
        gState.sg = state
    }
    const setCBState = (state: CBState) => {
        gState.cb = state
    }

    const cbDispatcher = cubeGameDispatcher(setCBStateListener(setCBState))
    const sgListener = setSGStateListener(setSGState)

    let cbState = gState.cb
    let sgState = gState.sg

    while (cbState.tag !== 'CBEoG') {
        doPlay(cbState, cbDispatcher, sgState, sgListener)

        cbState = gState.cb
        sgState = gState.sg
    }
    // console.log(formatPly(sgState.lastState().curPly))
    gameScore = gameScore.add(cbState.stake)
    console.log(formatStake(cbState.stake, cbState.eogStatus))

    console.log(
        `Result: red ${gameScore.redScore} - white ${gameScore.whiteScore}`
    )
}
run()
