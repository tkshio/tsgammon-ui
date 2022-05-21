import { useState } from 'react'
import { cube, GameConf, standardConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    concatCBListeners, CubeGameListeners,
    setCBStateListener
} from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import {
    cbOpening, CBState
} from 'tsgammon-core/dispatchers/CubeGameState'
import {
    RollListener,
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { BoardEventHandlers } from '../boards/Board'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { CubefulGameConfs } from '../CubefulGameBoard'
import { cbEventHandlersBuilder, concatCBEventHandlers, CubeGameEventHandlerAddOn, CubeGameEventHandlers } from "../CubeGameEventHandlers"
import { toState } from '../recordedGames/BGState'
import {
    SingleGameEventHandlers
} from '../SingleGameEventHandlers'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { cubefulSGListener } from '../useCubeGameState'
import { useMatchStateForCubeGame } from '../useMatchStateForCubeGame'
import { useSingleGameState } from '../useSingleGameState'
import { cubelessEventHandlers } from './Cubeless'
import {
    wrap
} from '../EventHandlerBuilder'

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
        {
            eventHandlers: matchStateEventHandler,
            listeners: matchStateListener,
        },
        { eventHandlers: {}, listeners: props }
    )
    const cbProps: CubefulGameProps = {
        sgState,
        cbState,
        cpState,
        ...listeners,
        matchState,
        ...handlers,
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
    ...addOns: CubeGameEventHandlerAddOn[]
): {
    handlers: CubeGameEventHandlers & SingleGameEventHandlers
} {
    const { handlers: cbEventHandlers } = cubefulEventHandlers(
        isCrawford,
        setCBState,
        ...addOns
    )

    // SGStateの管理に追加する
    const cubeGameAddOn = {
        eventHandlers: {},
        listeners: cubefulSGListener(cbState, cbEventHandlers),
    }

    const { handlers: sgHandlers } = cubelessEventHandlers(
        gameConf,
        setSGState,
        rollListener,
        cubeGameAddOn,
        ...addOns
    )

    return {
        handlers: {
            ...sgHandlers,
            ...cbEventHandlers,
            onStartCubeGame: () => {
                cbEventHandlers.onStartCubeGame()
                sgHandlers.onStartGame()
            },
        },
    }
}
function cubefulEventHandlers(
    isCrawford: boolean,
    setCBState: (cbState: CBState) => void,
    ...addOns: {
        eventHandlers: Partial<SingleGameEventHandlers & CubeGameEventHandlers>
        listeners: Partial<SingleGameListeners & CubeGameListeners>
    }[]
) {
    // キューブの状態管理の準備
    const cbListeners: CubeGameListeners = cubeGameListeners(setCBState)

    const builder = cbEventHandlersBuilder(isCrawford)

    const finalBuilder = addOns.reduce(
        (prev, cur) => prev.addOn(cur),
        wrap(builder, concatCBEventHandlers, concatCBListeners)
    )

    return { handlers: finalBuilder.build(cbListeners) }
}


function cubeGameListeners(setCBState: (cbState: CBState) => void) {
    return setCBStateListener(cbOpening(cube(1)), setCBState)
}

