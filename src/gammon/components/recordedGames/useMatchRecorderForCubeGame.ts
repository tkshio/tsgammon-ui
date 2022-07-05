import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { SingleGameEventHandlers } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameConf } from 'tsgammon-core/GameConf'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import {
    MatchRecorder,
    matchRecorderAsCBAddOn,
    matchRecorderAsSGAddOn,
} from 'tsgammon-core/records/MatchRecorder'
import { PlyRecordEoG, PlyRecordInPlay } from 'tsgammon-core/records/PlyRecord'
import { useMatchRecorder } from './useMatchRecorder'

export function useMatchRecorderForCubeGame(
    gameConf: GameConf,
    cbState: CBState,
    sgState: SGState,
    initialMatchRecord: MatchRecord<BGState>
): {
    matchRecord: MatchRecord<BGState>
    matchRecorder: MatchRecorder<BGState>
    resetMatchRecord: (index: number) => void
    matchRecorderAddOn: Partial<CubeGameListeners & SingleGameEventHandlers>
} {
    const [matchRecord, matchRecorder] =
        useMatchRecorder<BGState>(initialMatchRecord)

    const cbL = matchRecorderAsCBAddOn(
        gameConf,
        sgState,
        matchRecorder
    )
    const sbL = matchRecorderAsSGAddOn(
        bgMatchRecorderToSG(cbState, matchRecorder)
    )
    const resetMatchRecord = (index: number) => {
        matchRecorder.resumeTo(index)
    }

    return {
        matchRecord,
        matchRecorder,
        resetMatchRecord,
        matchRecorderAddOn: { ...cbL, ...sbL },
    }
}

function bgMatchRecorderToSG(
    cbState: CBState,
    matchRecorder: MatchRecorder<BGState>
): MatchRecorder<SGState> {
    return {
        recordPly: (plyRecord: PlyRecordInPlay, sgState: SGState) => {
            matchRecorder.recordPly(plyRecord, { cbState, sgState })
        },
        recordEoG: (plyRecord: PlyRecordEoG) => {
            matchRecorder.recordEoG(plyRecord)
        },
        resetCurGame: () => {
            matchRecorder.resetCurGame()
        },
        resumeTo: (index: number) => {
            const record = matchRecorder.resumeTo(index)
            return { ...record, state: record.state.sgState }
        },
    }
}
