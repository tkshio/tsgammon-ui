import { BGListener } from 'tsgammon-core/dispatchers/BGListener'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { GameConf } from 'tsgammon-core/GameConf'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import {
    MatchRecorder,
    matchRecorderAsCBAddOn
} from 'tsgammon-core/records/MatchRecorder'
import { useMatchRecorder } from './useMatchRecorder'

export function useMatchRecorderForCubeGame(
    gameConf: GameConf,
    bgState: BGState,
    initialMatchRecord: MatchRecord<BGState>
): {
    matchRecord: MatchRecord<BGState>
    matchRecorder: MatchRecorder<BGState>
    resetMatchRecord: (index: number) => void
    matchRecorderAddOn: Partial<BGListener>
} {
    const {sgState} = bgState
    const [matchRecord, matchRecorder] =
        useMatchRecorder<BGState>(initialMatchRecord)

    const matchRecorderAddOn = matchRecorderAsCBAddOn(gameConf, sgState, matchRecorder)
    const resetMatchRecord = (index: number) => {
        matchRecorder.resumeTo(index)
    }

    return {
        matchRecord,
        matchRecorder,
        resetMatchRecord,
        matchRecorderAddOn
    }
}
