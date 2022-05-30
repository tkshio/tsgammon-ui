import { BGState } from 'tsgammon-core/dispatchers/BGState'
import {
    CubeGameEventHandlerAddOn,
    CubeGameEventHandlers
} from 'tsgammon-core/dispatchers/CubeGameEventHandlers'
import {
    CBAction,
    CBEoG,
    CBResponse,
    CBState
} from 'tsgammon-core/dispatchers/CubeGameState'
import {
    matchStateForPointMatch,
    matchStateForUnlimitedMatch
} from 'tsgammon-core/dispatchers/MatchState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameConf } from 'tsgammon-core/GameConf'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import {
    PlyRecordEoG,
    plyRecordForDouble,
    plyRecordForEoG,
    plyRecordForPass,
    plyRecordForTake,
    PlyRecordInPlay
} from 'tsgammon-core/records/PlyRecord'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { sgEventHandlersForMatchRecorder } from '../apps/PointMatch'
import { MatchRecorder, useMatchRecorder } from './useMatchRecorder'

export function useMatchRecorderForCubeGame(
    gameConf: GameConf,
    matchLength: number,
    cbState: CBState,
    sgState: SGState,
    initialMatchRecord: MatchRecord<BGState>
): {
    matchRecord: MatchRecord<BGState>
    matchRecorder: MatchRecorder<BGState>
    resetMatchRecord: (index: number) => void
    matchRecorderAddOn: CubeGameEventHandlerAddOn
} {
    const initialMatchState =
        matchLength === 0
            ? matchStateForUnlimitedMatch(undefined, gameConf.jacobyRule)
            : matchStateForPointMatch(matchLength)
    const [matchRecord, matchRecorder] = useMatchRecorder<BGState>(
        gameConf,
        initialMatchState,
        initialMatchRecord
    )

    const cbH = cbEventHandlersForMatchRecorder(sgState, matchRecorder)
    const sbH = sgEventHandlersForMatchRecorder(
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
                onStartCubeGame: () => {
                    matchRecorder.resetCurGame()
                },
            },
            listeners: {
                onEndOfCubeGame: (cbState: CBEoG) => {
                    const { stake, eogStatus } = cbState.calcStake(gameConf)
                    const plyRecordEoG = plyRecordForEoG(
                        stake,
                        cbState.result,
                        eogStatus
                    )
                    matchRecorder.recordEoG(plyRecordEoG)
                },
            },
        },
    }
}

function cbEventHandlersForMatchRecorder(
    sgState: SGState,
    matchRecorder: MatchRecorder<BGState>
): Pick<CubeGameEventHandlers, 'onDouble' | 'onTake' | 'onPass'> {
    return { onDouble, onTake, onPass }
    function onDouble(cbState: CBAction) {
        const plyRecord = plyRecordForDouble(cbState.cubeState, cbState.isRed)
        matchRecorder.recordPly(plyRecord, { cbState, sgState })
    }

    function onTake(cbState: CBResponse) {
        const plyRecord = plyRecordForTake(cbState.isRed)
        matchRecorder.recordPly(plyRecord, { cbState, sgState })
    }

    function onPass(cbState: CBResponse) {
        const plyRecord = plyRecordForPass(
            cbState.isRed ? SGResult.WHITEWON : SGResult.REDWON
        )
        matchRecorder.recordPly(plyRecord, { cbState, sgState })
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
