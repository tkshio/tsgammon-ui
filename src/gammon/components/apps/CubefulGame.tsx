import {
    CubefulGameBoard,
    CubefulGameBoardProps,
    CubefulGameConfs,
} from '../CubefulGameBoard'
import { BoardEventHandlers } from '../boards/Board'
import { CheckerPlayListeners } from '../../dispatchers/CheckerPlayDispatcher'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import {
    GameState,
    toCBState,
    toSGState,
} from '../../dispatchers/utils/GameState'
import { useCubeGameListeners } from '../useCubeGameListeners'
import { CubeGameListeners } from '../../dispatchers/CubeGameDispatcher'
import { SingleGameListeners } from '../../dispatchers/SingleGameDispatcher'
import { useSingleGameListeners } from '../useSingleGameListeners'

export type CubefulGameProps = {
    state?: GameState
    cbConfs?: CubefulGameConfs
} & Partial<
    CubeGameListeners &
        SingleGameListeners &
        CheckerPlayListeners &
        BoardEventHandlers
>

export function CubefulGame(props: CubefulGameProps) {
    const { state } = props
    const initialCBState = toCBState(state)
    const initialSGState = toSGState(state)
    const [cbState, cbListeners] = useCubeGameListeners(initialCBState, props)
    const [sgState, sgListeners] = useSingleGameListeners(initialSGState, props)
    const [cpState, cpListeners] = useCheckerPlayListeners(undefined, props)

    const cbProps: CubefulGameBoardProps = {
        cbState,
        sgState,
        cpState,
        ...props,

        ...cbListeners,
        ...sgListeners,
        ...cpListeners,
    }

    return <CubefulGameBoard {...cbProps} />
}
