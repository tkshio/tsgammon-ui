import { GameConf, score, Score, standardConf } from 'tsgammon-core'
import { CheckerPlayState } from 'tsgammon-core/states/CheckerPlayState'
import { defaultSGState } from 'tsgammon-core/states/defaultStates'
import { SGState } from 'tsgammon-core/states/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/states/utils/GameSetup'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { buildSGEventHandler } from '../dispatchers/buildSGEventHandler'
import { CheckerPlayListeners } from '../dispatchers/CheckerPlayDispatcher'
import {
    eogEventHandlersSG,
    SGEoGHandler,
} from '../dispatchers/EOGEventHandlers'
import { RollListener, rollListener } from '../dispatchers/RollDispatcher'
import {
    setSGStateListener,
    singleGameDispatcher,
} from '../dispatchers/SingleGameDispatcher'
import { SingleGameEventHandlerExtensible } from '../dispatchers/SingleGameEventHandler'
import { useCheckerPlayListener } from '../useCheckerPlayListeners'
import { useSingleGameState } from '../useSingleGameState'
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

    const [cpState, cpListener] = useCheckerPlayListener()
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
        cpListener,
        handler,
        sgRecorder,
        eogHandler,
    }
}
