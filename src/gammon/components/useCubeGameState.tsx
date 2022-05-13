import { Dispatch, SetStateAction, useState } from 'react'
import { cube, GameConf } from 'tsgammon-core'
import {
    CubeGameDispatcher,
    cubeGameDispatcher,
    CubeGameListeners,
    decorate,
    decorate as decorateCB,
    setCBStateListener,
} from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { cbOpening, CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGEoG,
    SGInPlay,
    SGState,
    SGToRoll,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { CubeGameEventHandlers } from './CubeGameEventHandlers'
import { SingleGameEventHandlers } from './SingleGameBoard'
import { useSingleGameState } from './useSingleGameState'

export function useCubeGameState(
    gameConf: GameConf,
    isCrawford:boolean,
    initialSGState: SGState,
    initialCBState: CBState,
    rollListener: RollListener,
    ...listeners: Partial<SingleGameListeners & CubeGameListeners>[]
): {
    cbState: CBState
    sgState: SGState
    eventHandlers: CubeGameEventHandlers & SingleGameEventHandlers
} {
    const [cbState, cbListeners, setCBState] = useCubeGameListeners(
        initialCBState,
        ...listeners
    )

    const cubeGameEventHandlers: CubeGameEventHandlers = cubeGameEH(
        cubeGameDispatcher(isCrawford, decorateCB(cbListeners))
    )

    const sglisteners = cubefulSGEventHandler(cbState, cubeGameEventHandlers)

    const { sgState, singleGameEventHandlers } = useSingleGameState(
        gameConf,
        initialSGState,
        rollListener,
        ...[sglisteners, ...listeners]
    )
    return {
        cbState,
        sgState,
        eventHandlers: { ...singleGameEventHandlers, ...cubeGameEventHandlers },
    }

    function cubeGameEH(dispatcher: CubeGameDispatcher): CubeGameEventHandlers {
        return {
            onDouble: dispatcher.doDouble,
            onTake: dispatcher.doTake,
            onPass: dispatcher.doPass,

            onStartOpeningCheckerPlay: dispatcher.doStartOpeningCheckerPlay,
            onStartCheckerPlay: dispatcher.doStartCheckerPlay,
            onStartCubeAction: dispatcher.doStartCubeAction,
            onSkipCubeAction: dispatcher.doSkipCubeAction,
            onEndOfCubeGame: dispatcher.doEndOfCubeGame,
            onReset: () => setCBState(cbOpening(cube(1))),
            onSetCBState: (cbState: CBState) => setCBState(cbState),
        }
    }
}

export function cubefulSGEventHandler(
    state: CBState,
    cubeGameEH: CubeGameEventHandlers
): Partial<SingleGameListeners> {
    return {
        // オープニングロールがあった：手番を設定してInPlay状態に遷移
        onStartOpeningCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBOpening') {
                cubeGameEH.onStartOpeningCheckerPlay(state, sgInPlay.isRed)
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // チェッカープレイが終了した：キューブアクション状態またはロール待ち状態に遷移
        onAwaitRoll: (sgToRoll: SGToRoll) => {
            if (state.tag === 'CBInPlay') {
                cubeGameEH.onStartCubeAction(state)
            } else {
                console.warn('Unexpected state', state, sgToRoll)
            }
        },

        // ロールがあった：InPlay状態に遷移
        onStartCheckerPlay: (sgInPlay: SGInPlay) => {
            if (state.tag === 'CBToRoll' || state.tag === 'CBAction') {
                cubeGameEH.onStartCheckerPlay(state)
            } else {
                console.warn('Unexpected state', state, sgInPlay)
            }
        },

        // ゲームが終了した：キューブを加味したスコアを算出
        onEndOfGame: (sgEoG: SGEoG) => {
            cubeGameEH.onEndOfCubeGame(state, sgEoG.result, sgEoG.eogStatus)
        },
    }
}

function useCubeGameListeners(
    initialState: CBState,
    listeners: Partial<CubeGameListeners> = {}
): [CBState, CubeGameListeners, Dispatch<SetStateAction<CBState>>] {
    const [state, setState] = useState(initialState)
    const _listeners: CubeGameListeners = decorate(
        setCBStateListener(setState),
        listeners
    )
    return [state, _listeners, setState]
}
