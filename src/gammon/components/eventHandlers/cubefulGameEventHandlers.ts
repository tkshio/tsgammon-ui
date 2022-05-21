import {
    cubeGameDispatcher,
    CubeGameListeners
} from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import {
    CBState
} from 'tsgammon-core/dispatchers/CubeGameState'
import {
    RollListener,
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    singleGameDispatcher,
    SingleGameListeners
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGEoG,
    SGInPlay,
    SGState,
    SGToRoll
} from 'tsgammon-core/dispatchers/SingleGameState'
import {
    buildCBEventHandlers,
    CubeGameEventHandlers
} from './CubeGameEventHandlers'
import { EventHandlerAddOn } from './EventHandlerBuilder'
import { BGState } from '../BGState'
import {
    buildSGEventHandlers,
    SingleGameEventHandlers
} from './SingleGameEventHandlers'

export function cubefulGameEventHandlers(
    isCrawford: boolean,
    defaultState: BGState,
    cbState: CBState,
    setSGState: (sgState: SGState) => void,
    setCBState: (cbState: CBState) => void,
    rollListener: RollListener = rollListeners(),
    ...addOns: EventHandlerAddOn<
        CubeGameEventHandlers & SingleGameEventHandlers,
        CubeGameListeners & SingleGameEventHandlers
    >[]
): {
    handlers: CubeGameEventHandlers & SingleGameEventHandlers
} {
    const { cbState: defaultCBState, sgState: defaultSGState } = defaultState

    const { handlers: cbEventHandlers } = buildCBEventHandlers(
        cubeGameDispatcher(isCrawford),
        defaultCBState,
        setCBState,
        {
            eventHandlers: {
                onStartCubeGame: () => {
                    sgEventHandlers.onStartGame()
                },
            },
            listeners: {},
        },
        ...addOns
    )

    const { handlers: sgEventHandlers } = buildSGEventHandlers(
        defaultSGState,
        setSGState,
        singleGameDispatcher(),
        rollListener,
        {
            eventHandlers: {},
            listeners: cubefulSGListener(cbState, cbEventHandlers),
        },
        ...addOns
    )

    return {
        handlers: {
            ...sgEventHandlers,
            ...cbEventHandlers,
        },
    }
}


function cubefulSGListener(
    state: CBState,
    eventHandlers: CubeGameEventHandlers
): Partial<SingleGameListeners> {
    return {
        // オープニングロールがあった：手番を設定してInPlay状態に遷移
        onStartOpeningCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBOpening') {
                eventHandlers.onStartOpeningCheckerPlay(state, sgInPlay.isRed)
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // チェッカープレイが終了した：キューブアクション状態またはロール待ち状態に遷移
        onAwaitRoll: (sgToRoll: SGToRoll) => {
            if (state.tag === 'CBInPlay') {
                eventHandlers.onStartCubeAction(state)
            } else {
                console.warn('Unexpected state', state, sgToRoll)
            }
        },

        // ロールがあった：InPlay状態に遷移
        onStartCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBToRoll' || state.tag === 'CBAction') {
                eventHandlers.onStartCheckerPlay(state)
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // ゲームが終了した：キューブを加味したスコアを算出
        onEndOfGame: (sgEoG: SGEoG) => {
            eventHandlers.onEndOfCubeGame(state, sgEoG.result, sgEoG.eogStatus)
        },
    }
}
