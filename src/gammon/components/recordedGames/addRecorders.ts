import { BoardStateNode } from 'tsgammon-core'
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import {
    CBEoG,
    CBResponse,
    CBState,
    CBToRoll
} from 'tsgammon-core/dispatchers/CubeGameState'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGEoG,
    SGInPlay,
    SGToRoll
} from 'tsgammon-core/dispatchers/SingleGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import {
    plyRecordForCheckerPlay,
    plyRecordForDouble,
    plyRecordForEoG,
    plyRecordForPass,
    plyRecordForTake
} from 'tsgammon-core/records/PlyRecord'
import { SingleGameEventHandlers } from '../SingleGameBoard'
import { BGState } from './BGState'
import { MatchRecorder } from './useMatchRecorder'

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
export function asSGEventHandlers(
    cbState: CBState,
    matchRecorder: MatchRecorder<BGState>
): Partial<SingleGameEventHandlers> {
    return {
        onCommit: (sgState: SGInPlay, node: BoardStateNode) => {
            matchRecorder.recordPly(plyRecordForCheckerPlay(sgState.curPly), {
                cbState,
                sgState,
            })
        },
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
