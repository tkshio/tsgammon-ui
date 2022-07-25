import { score, Score } from 'tsgammon-core'
import { setBGStateListener } from 'tsgammon-core/dispatchers/BGEventHandler'
import { BGListener } from 'tsgammon-core/dispatchers/BGListener'
import { BGState, toState } from 'tsgammon-core/dispatchers/BGState'
import {
    BGEventHandlersExtensible,
    buildBGEventHandler
} from 'tsgammon-core/dispatchers/buildBGEventHandler'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    BGEoGHandler,
    eogEventHandler
} from 'tsgammon-core/dispatchers/EOGEventHandlers'
import {
    RollListener,
    rollListener
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { MatchState, shouldSkipCubeAction } from 'tsgammon-core/MatchState'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { BGRecorder, useBGRecorder } from '../useBGRecorder'
import { useBGState } from '../useBGState'
import { useCheckerPlayListener } from '../useCheckerPlayListeners'

export type CubefulHookProps = {
    gameSetup?: GameSetup
    gameConf?: GameConf
    diceSource?: DiceSource
    matchLength?: number
    matchScore?: Score
    recordMatch?: boolean
    isCrawford?: boolean
} & Partial<RollListener & CheckerPlayListeners & BGListener>

export type CubefulHookItems = {
    bgState: BGState
    cpState: CheckerPlayState | undefined
    bgEventHandler: BGEventHandlersExtensible
    eogHandler: BGEoGHandler
    cpListener: Partial<CheckerPlayListeners>
    matchState: MatchState
    bgRecorder: BGRecorder
}

export function useCubeful(props: CubefulHookProps): CubefulHookItems {
    const {
        gameSetup,
        gameConf = standardConf,
        diceSource,
        onRollRequest,
        matchLength = 0,
        matchScore = score(),
        recordMatch = false,
        isCrawford = false,
        ...exListeners
    } = props
    const rListener = rollListener({
        diceSource,
        onRollRequest,
    })

    // 盤面の指定があれば、そこから開始
    const initialBGState = toState(gameSetup, gameConf)

    // 状態管理
    const { bgState, setBGState } = useBGState(initialBGState)
    const bgListener = setBGStateListener(defaultBGState(gameConf), setBGState)

    // チェッカープレイ中の状態管理
    const [cpState, cpListener] = useCheckerPlayListener(undefined, exListeners)

    const recordConf = {
        gameConf,
        isCrawford,
        matchLength,
        matchScore
    }
    // 指定に応じて棋譜をとる、または単にマッチ状態を管理する
    const bgRecorder = useBGRecorder(
        recordMatch
            ? {
                  ...recordConf,
                  recordMatch: true,
                  setBGState,
              }
            : { ...recordConf, recordMatch: false }
    )

    const matchState = bgRecorder.matchState
    // キューブありのゲームの進行管理
    const skipCubeAction =
        bgState.cbState.tag === 'CBInPlay' &&
        shouldSkipCubeAction(
            matchState,
            bgState.cbState.cubeState.value,
            // skipCubeActionが意味を持つのは、実質的にはコミット直前の時だけで、
            // その時点ではまだ相手の手番なので、自分のスコアを基準に判定するためには
            // 反転させる必要がある
            !bgState.cbState.isRed
        )

    const _listeners = [bgListener, bgRecorder.matchListener, exListeners]

    const bgEventHandler = buildBGEventHandler(
        skipCubeAction,
        rListener,
        ..._listeners
    )
    const eogHandler = eogEventHandler(..._listeners)

    return {
        bgState,
        cpState,
        bgEventHandler,
        eogHandler,
        cpListener,
        matchState,
        bgRecorder,
    }
}
