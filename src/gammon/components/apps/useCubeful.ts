import { GameConf, score, Score, standardConf } from 'tsgammon-core'
import { MatchState, shouldSkipCubeAction } from 'tsgammon-core/MatchState'
import { BGState, toState } from 'tsgammon-core/states/BGState'
import { CBInPlay } from 'tsgammon-core/states/CubeGameState'
import { defaultBGState } from 'tsgammon-core/states/defaultStates'
import { GameSetup } from 'tsgammon-core/states/utils/GameSetup'
import { DiceSource } from 'tsgammon-core/utils/DiceSource'
import { setBGStateListener } from '../dispatchers/BGEventHandler'
import { BGListener } from '../dispatchers/BGListener'
import {
    BGEventHandlersExtensible,
    buildBGEventHandler,
} from '../dispatchers/buildBGEventHandler'
import { CheckerPlayListeners } from '../dispatchers/CheckerPlayDispatcher'
import { BGEoGHandler, eogEventHandler } from '../dispatchers/EOGEventHandlers'
import { RollListener, rollListener } from '../dispatchers/RollDispatcher'
import { singleGameDispatcher } from '../dispatchers/SingleGameDispatcher'
import { CheckerPlayState } from '../states/CheckerPlayState'
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
        matchScore,
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
    const skipCubeAction = (cbState: CBInPlay) => {
        return shouldSkipCubeAction(
            matchState,
            cbState.cubeState.value,
            // skipCubeActionが意味を持つのは、実質的にはコミット直前の時だけで、
            // その時点ではまだ相手の手番なので、自分のスコアを基準に判定するためには
            // 反転させる必要がある
            !cbState.isRed
        )
    }

    const _listeners = [bgListener, bgRecorder.matchListener, exListeners]
    const sgDispatcher = singleGameDispatcher(gameConf.transition)
    const bgEventHandler = buildBGEventHandler(
        sgDispatcher,
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
