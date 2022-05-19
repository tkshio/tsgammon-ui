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
import { CubefulGameConfs } from '../CubefulGameBoard'
import {
    CubeGameEventHandlers,
    SingleGameEventHandlers,
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
    const { sgState, setSGState } = useSingleGameState(initialSGState)
    const { cbState, setCBState } = useCubeGameState(initialCBState)
    const { matchState, matchStateListener, matchStateEventHandler } =
        useMatchStateForCubeGame(matchLength, gameConf)

    const [cpState, cpListeners] = useCheckerPlayListeners(undefined, props)
    const { handlers } = cubefulGameEventHandlers(
        gameConf,
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
        onStartCubeGame: () => {
            handlers.onStartCubeGame()
            matchStateEventHandler.onStartCubeGame()
        },
        ...cpListeners,
    }

    return <CubefulGame {...cbProps} />
}

export function useCubeGameState(initialCBState: CBState) {
    const [cbState, setCBState] = useState(initialCBState)
    return {
        cbState,
        setCBState,
    }
}
export function cubefulGameEventHandlers(
    gameConf: GameConf,
    isCrawford: boolean,
    cbState: CBState,
    setSGState: (sgState: SGState) => void,
    setCBState: (cbState: CBState) => void,
    rollListener: RollListener = rollListeners(),
    ...listeners: Partial<CubeGameListeners & SingleGameListeners>[]
): {
    handlers: CubeGameEventHandlers & SingleGameEventHandlers
} {
    const defaultCBState = cbOpening(cube(1))

    // キューブの状態管理の準備
    const cbListeners: CubeGameListeners = decorateCB(
        setCBStateListener(defaultCBState, setCBState),
        ...listeners
    )

    const cbEventHandlers:CubeGameEventHandlers = cubeGameEH(isCrawford, cbListeners)
    // SGStateの管理に追加する
    const sgListeners = cubefulSGListener(cbState, cbEventHandlers)
    const {
        handlers: sgHandlers,
    } = cubelessEventHandlers(
        gameConf,
        setSGState,
        rollListener,
        sgListeners,
        ...listeners
    )

    const handlers: CubeGameEventHandlers & SingleGameEventHandlers= {
        ...sgHandlers,
        ...cbEventHandlers,
    }
    return { handlers }
}

function cubeGameEH(
    isCrawford: boolean,
    cbListeners: CubeGameListeners
): CubeGameEventHandlers {
    const dispatcher = cubeGameDispatcher(isCrawford, cbListeners)

    return {
        onStartCubeGame: dispatcher.doStartCubeGame,

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
