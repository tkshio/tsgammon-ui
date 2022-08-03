import { buildSGEventHandler } from 'tsgammon-core/dispatchers/buildSGEventHandler'
import { defaultSGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    RollListener,
    rollListener,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { setSGStateListener } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { SingleGameEventHandlerExtensible } from 'tsgammon-core/dispatchers/SingleGameEventHandler'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { useCheckerPlayListener } from '../useCheckerPlayListeners'
import { useSingleGameState } from '../useSingleGameState'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { useSGRecorder } from './useSGRecorder'
import { SGRecorder } from './Cubeless'
import {
    eogEventHandlersSG,
    SGEoGHandler,
} from 'tsgammon-core/dispatchers/EOGEventHandlers'
import { score, Score } from 'tsgammon-core'

export function useCubeless(
    conf: {
        gameSetup?: GameSetup
        gameConf?: GameConf
        diceSource?: DiceSource
        recordMatch?: boolean
        matchScore?:Score
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
        matchScore = score()
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
    const handler = buildSGEventHandler(rListener, ...listeners)
    const eogHandler = eogEventHandlersSG(...listeners)
    return {
        sgState,
        cpState,
        cpListener,
        handler,
        sgRecorder,
        eogHandler,
    }
}
