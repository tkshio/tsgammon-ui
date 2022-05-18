import { useState } from 'react'
import { cube, GameConf, standardConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    cubeGameDispatcher,
    CubeGameListeners,
    decorate as decorateCB,
    setCBStateListener,
} from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { cbOpening, CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { BoardEventHandlers } from '../boards/Board'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { MatchState } from "../MatchState"
import { CubefulGameConfs } from '../CubefulGameBoard'
import {
    CubeGameEventHandlers,
    SingleGameEventHandlers,
    StartNextGameHandler,
} from '../EventHandlers'
import { toState } from '../recordedGames/BGState'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { cubefulSGListener } from '../useCubeGameState'
import { useMatchStateForCubeGame } from '../useMatchStateForCubeGame'
import { useSingleGameState } from '../useSingleGameState'
import { cubelessEventHandlers } from './Cubeless'

export type MoneyGameProps = {
    gameConf: GameConf
    setup?: GameSetup
    cbConfs?: CubefulGameConfs
} & Partial<
    CubeGameListeners &
        SingleGameListeners &
        CheckerPlayListeners &
        BoardEventHandlers
>
export function MoneyGame(props: MoneyGameProps) {
    const {
        gameConf = { ...standardConf, jacobyRule: true },
        setup,
        ...listeners
    } = props
    const matchLength = 0
    const { sgState: initialSGState, cbState: initialCBState } = toState(setup)
    const { sgState, setSGState } = useSingleGameState(gameConf, initialSGState)
    const { cbState, setCBState } = useCBState(initialCBState)
    const { matchState,  matchStateListener, matchStateEventHandler } = useMatchStateForCubeGame(
        matchLength,
        gameConf
    )

    const [cpState, cpListeners] = useCheckerPlayListeners(undefined, props)
    const { handlers } = cubefulGameEventHandlers(
        false,
        cbState,
        setSGState,
        setCBState,
        rollListeners(),
        matchStateListener,
        props
    )
    const cbProps: CubefulGameProps = {
        sgState,
        cbState,
        cpState,
        ...listeners,
        matchState,
        ...handlers,
        onStartNextGame:()=>{
            handlers.onStartNextGame()
            matchStateEventHandler.onStartNextGame()
        },
        ...cpListeners,
    }

    return <CubefulGame {...cbProps} />
}

export function useCBState(initialCBState: CBState) {
    const [cbState, setCBState] = useState(initialCBState)
    const defaultCBState = cbOpening(cube(1))
    return {
        cbState,
        setCBState: (cbState: CBState = defaultCBState) => setCBState(cbState),
    }
}
export function cubefulGameEventHandlers(
    isCrawford:boolean,
    cbState: CBState,
    setSGState: (sgState?: SGState) => void,
    setCBState: (cbState?: CBState) => void,
    rollListener: RollListener = rollListeners(),
    ...listeners: Partial<CubeGameListeners & SingleGameListeners>[]
): {
    handlers: StartNextGameHandler &
        CubeGameEventHandlers &
        SingleGameEventHandlers
} {
    // キューブの状態管理の準備
    const cbListeners: CubeGameListeners = decorateCB(
        setCBStateListener(setCBState),
        ...listeners
    )

    const cbEventHandlers = cubeGameEH(isCrawford, cbListeners)
    // SGStateの管理に追加する
    const sgListeners = cubefulSGListener(cbState, cbEventHandlers)
    const { handlers: sgHandlers_and_startNext } = cubelessEventHandlers(
        setSGState,
        rollListener,
        sgListeners,
        ...listeners
    )
    const { onStartNextGame, ...sgHandlers } = sgHandlers_and_startNext

    const handlers = {
        ...sgHandlers,
        ...cbEventHandlers,
        onStartNextGame: () => {
            onStartNextGame()
            setCBState()
        },
    }
    return { handlers }
}

function cubeGameEH(
    isCrawford: boolean,
    cbListeners: CubeGameListeners
): CubeGameEventHandlers {
    const dispatcher = cubeGameDispatcher(isCrawford, cbListeners)

    return {
        onDouble: dispatcher.doDouble,
        onTake: dispatcher.doTake,
        onPass: dispatcher.doPass,

        onStartOpeningCheckerPlay: dispatcher.doStartOpeningCheckerPlay,
        onStartCheckerPlay: dispatcher.doStartCheckerPlay,
        onStartCubeAction: dispatcher.doStartCubeAction,
        onSkipCubeAction: dispatcher.doSkipCubeAction,
        onEndOfCubeGame: dispatcher.doEndOfCubeGame,
    }
}
