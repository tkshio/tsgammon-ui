import { useState } from 'react'
import { cube, GameConf, standardConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    cubeGameDispatcher,
    CubeGameListeners,
    decorate as decorateCB,
    setCBStateListener
} from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { cbOpening, CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import {
    RollListener,
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGState
} from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { BoardEventHandlers } from '../boards/Board'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { CubefulGameConfs } from '../CubefulGameBoard'
import {
    CubeGameEventHandlers,
    SingleGameEventHandlers,
    StartNextGameHandler
} from '../EventHandlers'
import { toState } from '../recordedGames/BGState'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { cubefulSGListener } from '../useCubeGameState'
import { useMatchScoreForCubeGame } from '../useMatchScoreForCubeGame'
import { useSingleGameState } from '../useSingleGameState'
import { useCubelessGameState } from './Cubeless'

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
    const { sgState, setSGState } = useSingleGameState(
        gameConf,
        toState(setup).sgState
    )
    const { cbState, setCBState } = useCBState(toState(setup).cbState)
    const { matchScore, matchScoreListener } =
        useMatchScoreForCubeGame(gameConf)

    const rollListener = rollListeners()
    const [cpState, cpListeners] = useCheckerPlayListeners(undefined, props)
    const { handlers } = useCubefulGameState(
        cbState,
        setSGState,
        setCBState,
        rollListener,
        matchScoreListener,
        props
    )

    const cbProps: CubefulGameProps = {
        sgState,
        cbState,
        cpState,
        ...listeners,
        matchLength: 0,
        matchScore,
        ...handlers,
        ...cpListeners,
    }

    return <CubefulGame {...cbProps} />
}
export function useCBState( initialCBState: CBState) {
    const [cbState, setCBState] = useState(initialCBState)
    const defaultCBState = cbOpening(cube(1))
    return {
        cbState,
        setCBState: (cbState: CBState = defaultCBState) => setCBState(cbState),
    }
}
export function useCubefulGameState(
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

    const cbEventHandlers = cubeGameEH(false, cbListeners)
    // SGStateの管理に追加する
    const sgListeners = cubefulSGListener(cbState, cbEventHandlers)
    const { handlers: sgHandlers_and_startNext } = useCubelessGameState(
        setSGState,
        rollListener,
        sgListeners,
        ...listeners
    )
    const { onStartNextGame: _, ...sgHandlers } = sgHandlers_and_startNext

    const handlers = {
        ...sgHandlers,
        ...cbEventHandlers,
        onStartNextGame: () => {
            setSGState()
            setCBState()
        },
    }
    return { handlers }
}

function cubeGameEH(
    isCrawford: boolean,
    cbListeners: CubeGameListeners
): CubeGameEventHandlers {
    const dispatcher = cubeGameDispatcher(isCrawford, decorateCB(cbListeners))

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
