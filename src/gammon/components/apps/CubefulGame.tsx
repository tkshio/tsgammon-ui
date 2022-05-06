import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { GameSetup, toCBState, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { BoardEventHandlers } from '../boards/Board'
import {
    CubefulGameBoard,
    CubefulGameBoardProps,
    CubefulGameConfs
} from '../CubefulGameBoard'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useCubeGameListeners } from '../useCubeGameListeners'
import { useSingleGameListeners } from '../useSingleGameListeners'

export type CubefulGameProps = {
    state?: GameSetup
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
