import { GameConf } from 'tsgammon-core'
import {
    plyRecordForCheckerPlay,
    plyRecordForDouble,
    plyRecordForEoG,
    plyRecordForPass,
    plyRecordForTake,
} from 'tsgammon-core/records/PlyRecord'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { BGState } from 'tsgammon-core/states/BGState'
import {
    CBAction,
    CBEoG,
    CBInPlay,
    CBResponse,
    CBToRoll,
} from 'tsgammon-core/states/CubeGameState'
import {
    SGEoG,
    SGInPlay,
    SGState,
    SGToRoll,
} from 'tsgammon-core/states/SingleGameState'
import { BGListener } from '../dispatchers/BGListener'
import { SingleGameListener } from '../dispatchers/SingleGameListener'
import { MatchRecorder } from './MatchRecorder'

/**
 * MatchRecorderをラップして、SingleGameListnerとして返す
 * @param matchRecorder ラップされるMatchRecorder
 * @returns
 */
export function matchRecordingSGListener(
    matchRecorder: MatchRecorder<SGState>
): Partial<SingleGameListener> {
    return {
        onCheckerPlayCommitted: (committedState: SGInPlay) => {
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(committedState.curPly),
                committedState
            )
        },

        onGameStarted: () => {
            matchRecorder.resetCurGame()
        },

        onEndOfGame: (sgEoG: SGEoG) => {
            const { stake, result, eogStatus } = sgEoG
            matchRecorder.recordEoG(plyRecordForEoG(stake, result, eogStatus))
        },
    }
}

/**
 * MatchRecorderをラップして、BGListnerとして返す
 * @param matchRecorder ラップされるMatchRecorder
 * @returns
 */
export function matchRecordingBGListener(
    gameConf: GameConf,
    matchRecorder: MatchRecorder<BGState>
): Partial<BGListener> {
    return {
        onDoubled: (
            bgState: { cbState: CBResponse; sgState: SGToRoll },
            lastState: CBAction
        ) => {
            const plyRecord = plyRecordForDouble(
                lastState.cubeState,
                lastState.isRed
            )
            matchRecorder.recordPly(plyRecord, {
                cbState: lastState,
                sgState: bgState.sgState,
            })
        },

        onDoubleAccepted: (
            bgState: { cbState: CBToRoll; sgState: SGToRoll },
            lastState: CBResponse
        ) => {
            const plyRecord = plyRecordForTake(lastState.isRed)
            matchRecorder.recordPly(plyRecord, {
                cbState: lastState,
                sgState: bgState.sgState,
            })
        },
        onPassed: (
            bgState: { cbState: CBResponse; sgState: SGToRoll },
            isRedWon: boolean
        ) => {
            const plyRecord = plyRecordForPass(
                isRedWon ? SGResult.REDWON : SGResult.WHITEWON
            )
            matchRecorder.recordPly(plyRecord, bgState)
        },
        onBGGameStarted: () => {
            matchRecorder.resetCurGame()
        },

        onCommitted: (bgState: { cbState: CBInPlay; sgState: SGInPlay }) => {
            const committedState = bgState.sgState
            matchRecorder.recordPly(
                plyRecordForCheckerPlay(committedState.curPly),
                bgState
            )
        },
        onEndOfBGGame: (bgState: { cbState: CBEoG; sgState: SGState }) => {
            const { stake, eogStatus } = bgState.cbState.calcStake(gameConf)
            const plyRecordEoG = plyRecordForEoG(
                stake,
                bgState.cbState.result,
                eogStatus
            )
            matchRecorder.recordEoG(plyRecordEoG)
        },
    }
}
