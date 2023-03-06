import { GameConf, score, Score, standardConf } from 'tsgammon-core'
import { defaultSGState } from 'tsgammon-core/states/defaultStates'
import { SGState } from 'tsgammon-core/states/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/states/utils/GameSetup'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { buildSGEventHandler } from '../components/dispatchers/buildSGEventHandler'
import { CheckerPlayListeners } from '../components/dispatchers/CheckerPlayDispatcher'
import {
    eogEventHandlersSG,
    SGEoGHandler,
} from '../components/dispatchers/EOGEventHandlers'
import {
    RollListener,
    rollListener,
} from '../components/dispatchers/RollDispatcher'
import {
    setSGStateListener,
    singleGameDispatcher,
} from '../components/dispatchers/SingleGameDispatcher'
import { SingleGameEventHandlerExtensible } from '../components/dispatchers/SingleGameEventHandler'
import { CheckerPlayState } from '../components/states/CheckerPlayState'
import { useCheckerPlayListener } from '../components/useCheckerPlayListeners'
import { useSingleGameState } from '../components/useSingleGameState'
import { SGRecorder } from './Cubeless'
import { useSGRecorder } from './useSGRecorder'

export function useCubeless(
    conf: {
        gameSetup?: GameSetup
        gameConf?: GameConf
        diceSource?: DiceSource
        recordMatch?: boolean
        matchScore?: Score
    } & Partial<RollListener>
): {
    sgState: SGState
    cpState: CheckerPlayState | undefined
    clearCPState: () => void
    cpListener: CheckerPlayListeners
    handler: SingleGameEventHandlerExtensible
    sgRecorder: SGRecorder
    eogHandler: SGEoGHandler
} {
    const {
        gameSetup,
        gameConf = standardConf,
        diceSource,
        onRollRequest,
        recordMatch = false,
        matchScore = score(),
    } = conf
    const rListener = rollListener({
        diceSource,
        onRollRequest,
    })
    const initialSGState = toSGState(gameSetup, gameConf)
    const { sgState, setSGState } = useSingleGameState(initialSGState)

    const { cpState, cpListener, clearCPState } = useCheckerPlayListener()
    const { sgRecorder, matchRecordListener } = useSGRecorder(
        gameConf,
        setSGState,
        recordMatch,
        matchScore
    )
    const listeners = [
        setSGStateListener(defaultSGState(gameConf), setSGState),
        matchRecordListener,
    ]
    const sgDispatcher = singleGameDispatcher(gameConf.transition)
    const handler = buildSGEventHandler(sgDispatcher, rListener, ...listeners)
    const eogHandler = eogEventHandlersSG(sgDispatcher, ...listeners)
    return {
        sgState,
        cpState,
        clearCPState,
        cpListener,
        handler,
        sgRecorder,
        eogHandler,
    }
}
