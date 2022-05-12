import { CubeGameListeners } from "tsgammon-core/dispatchers/CubeGameDispatcher"
import { CBEoG, CBResponse, CBToRoll } from "tsgammon-core/dispatchers/CubeGameState"
import { SingleGameListeners } from "tsgammon-core/dispatchers/SingleGameDispatcher"
import { SGEoG, SGToRoll } from "tsgammon-core/dispatchers/SingleGameState"
import { StakeConf } from "tsgammon-core/dispatchers/StakeConf"
import { plyRecordForCheckerPlay, plyRecordForDouble, plyRecordForEoG, plyRecordForPass, plyRecordForTake } from "tsgammon-core/records/PlyRecord"
import { BGState } from "./BGState"
import { MatchRecorder } from "./useMatchRecorder"

export function asCBListeners(
    matchRecorder: MatchRecorder<BGState>,
    stakeConf: StakeConf,
    state: BGState
): Partial<CubeGameListeners> {
    return { onDouble, onTake, onEndOfCubeGame }

    function onDouble(nextState: CBResponse) {
        const plyRecord = plyRecordForDouble(
            nextState.cubeState,
            nextState.isDoubleFromRed
        )
        matchRecorder.recordPly(plyRecord, state)
    }

    function onTake(nextState: CBToRoll) {
        const plyRecord = plyRecordForTake(!nextState.isRed)
        matchRecorder.recordPly(plyRecord, state)
    }

    function onEndOfCubeGame(nextState: CBEoG) {
        if (nextState.isWonByPass) {
            const plyRecord = plyRecordForPass(nextState.result)
            matchRecorder.recordPly(plyRecord, state)
        }
        const stake = nextState.calcStake(stakeConf).stake
        const plyRecordEoG = plyRecordForEoG(
            stake,
            nextState.result,
            nextState.eogStatus
        )
        matchRecorder.recordEoG(plyRecordEoG)
    }
}

export function asSGListeners(
    matchRecorder: MatchRecorder<BGState>,
    state: BGState
): Partial<SingleGameListeners> {
    return { onAwaitRoll: recordPly, onEndOfGame: recordPly }

    function recordPly(nextState: SGToRoll | SGEoG) {
        const lastState = nextState.lastState()
        const plyRecord = plyRecordForCheckerPlay(lastState.curPly)
        matchRecorder.recordPly(plyRecord, {
            cbState: state.cbState,
            sgState: lastState,
        })
    }
}
