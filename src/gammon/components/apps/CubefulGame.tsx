import { DiceRoll } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { cubefulSGListener } from 'tsgammon-core/dispatchers/cubefulSGListener'
import {
    CubeGameDispatcher,
    cubeGameDispatcher,
    CubeGameListeners,
    decorate as decorateCB
} from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { rollListeners } from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    decorate as decorateSG,
    singleGameDispatcher,
    SingleGameDispatcher,
    SingleGameListeners
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGOpening, SGToRoll } from 'tsgammon-core/dispatchers/SingleGameState'
import {
    GameSetup,
    toCBState,
    toSGState
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import {
    CubefulGameBoard,
    CubefulGameBoardProps,
    CubefulGameConfs,
    CubeGameEventHandlers
} from '../CubefulGameBoard'
import { SingleGameEventHandlers } from '../SingleGameBoard'
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

    function cubeGameEH(dispatcher: CubeGameDispatcher): CubeGameEventHandlers {
        return {
            onDoubleOffer: dispatcher.doDouble,
            onTake: dispatcher.doTake,
            onPass: dispatcher.doPass,
        }
    }
    const rollListener = rollListeners({
        isRollHandlerEnabled: false,
        diceSource: randomDiceSource,
    })
    const isCrawford = false
    const cbDispatcher = cubeGameDispatcher(isCrawford, decorateCB(cbListeners))
    const cubeGameEventHandlers: CubeGameEventHandlers =
        cubeGameEH(cbDispatcher)
    function sgEH(dispatcher: SingleGameDispatcher): SingleGameEventHandlers {
        return {
            onCommit: dispatcher.doCommitCheckerPlay,
            onRoll: (sgState: SGToRoll) =>
                rollListener.onRollRequest((dices: DiceRoll) => {
                    console.log(sgState, dices)
                    dispatcher.doRoll(sgState, dices)
                }),
            onRollOpening: (sgState: SGOpening) =>
                rollListener.onRollRequest((dices: DiceRoll) =>
                    dispatcher.doOpeningRoll(sgState, dices)
                ),
        }
    }
    const singleGameEventHandlers: SingleGameEventHandlers = sgEH(
        singleGameDispatcher(
            decorateSG(cubefulSGListener(sgListeners, cbState, cbDispatcher))
        )
    )

    const cbProps: CubefulGameBoardProps = {
        cbState,
        sgState,
        cpState,
        ...props,

        ...cubeGameEventHandlers,
        ...singleGameEventHandlers,
        ...cpListeners,
    }

    return <CubefulGameBoard {...cbProps} />
}
