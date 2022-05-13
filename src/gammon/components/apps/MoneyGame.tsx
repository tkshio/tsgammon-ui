import { GameConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    CubeGameListeners
} from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import {
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    GameSetup,
    toCBState,
    toSGState
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { CubefulGameConfs } from '../CubefulGameBoard'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useCubeGameState } from '../useCubeGameState'
export type MoneyGameProps = {
    gameConf: GameConf
    state?: GameSetup
    cbConfs?: CubefulGameConfs
} & Partial<
    CubeGameListeners &
        SingleGameListeners &
        CheckerPlayListeners &
        BoardEventHandlers
>

export function MoneyGame(props: MoneyGameProps) {
    const { gameConf, state } = props
    const initialCBState = toCBState(state)
    const initialSGState = toSGState(state)
    const rollListener = rollListeners({
        isRollHandlerEnabled: false,
        diceSource: randomDiceSource,
    })

    const [cpState, cpListeners] = useCheckerPlayListeners(undefined, props)
    const { cbState, sgState, eventHandlers } = useCubeGameState(
        gameConf,
        false,
        initialSGState,
        initialCBState,
        rollListener,
        props
    )
    const cbProps: CubefulGameProps = {
        cbState,
        sgState,
        cpState,
        ...props,

        ...eventHandlers,
        ...cpListeners,
    }

    return <CubefulGame {...cbProps} />
}