import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { CubeGameEventHandlers } from 'tsgammon-core/dispatchers/CubeGameEventHandlers'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { EventHandlerAddOn } from 'tsgammon-core/dispatchers/EventHandlerBuilder'
import { SingleGameEventHandlers } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameConf } from 'tsgammon-core/GameConf'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import {
    MatchRecorder,
    matchRecorderAsCBAddOn,
    matchRecorderAsSGAddOn
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
    matchRecorderAddOn: EventHandlerAddOn<
        CubeGameEventHandlers & SingleGameEventHandlers,
        CubeGameListeners & SingleGameEventHandlers
    >
} {
    const [matchRecord, matchRecorder] =
        useMatchRecorder<BGState>(initialMatchRecord)

    const { eventHandlers: cbH, listeners } = matchRecorderAsCBAddOn(
        gameConf,
        sgState,
        matchRecorder
    )
    const { eventHandlers: sbH } = matchRecorderAsSGAddOn(
        bgMatchRecorderToSG(cbState, matchRecorder)
    )
    const resetMatchRecord = (index: number) => {
        matchRecorder.resumeTo(index)
    }

    return {
        matchRecord,
        matchRecorder,
        resetMatchRecord,
        matchRecorderAddOn: {
            eventHandlers: {
                ...cbH,
                ...sbH,
            },
            listeners,
        },
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
            return matchRecorder.resumeTo(index).sgState
        },
    }
}
