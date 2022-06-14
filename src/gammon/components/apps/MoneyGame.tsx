import { GameConf, Score, score, standardConf } from 'tsgammon-core'
import { toState } from 'tsgammon-core/dispatchers/BGState'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { cubefulGameEventHandlers } from 'tsgammon-core/dispatchers/cubefulGameEventHandlers'
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { CBOperator } from '../operators/CBOperator'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { OperationConfs } from '../SingleGameBoard'
import { useCBAutoOperator } from '../useCBAutoOperator'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useCubeGameState } from '../useCubeGameState'
import { useMatchState } from '../useMatchState'
import { useResignState } from '../useResignState'
import { useSingleGameState } from '../useSingleGameState'
import { mayResignOrNot } from './PointMatch'

export type MoneyGameProps = {
    gameConf: GameConf
    matchScore?: Score
    setup?: GameSetup
    autoOperators?: { cb?: CBOperator; sg?: SGOperator; rs?: RSOperator }
    opConfs?: OperationConfs
    isRollHandlerEnabled?: boolean
    diceSource?: DiceSource
} & Partial<
    CubeGameListeners &
        SingleGameListeners &
        RollListener &
        CheckerPlayListeners &
        BoardEventHandlers
>

export function MoneyGame(props: MoneyGameProps) {
    const {
        gameConf = { ...standardConf, jacobyRule: true },
        matchScore = score(),
        setup,
        autoOperators = { cb: undefined, sg: undefined },
        isRollHandlerEnabled = false,
        diceSource = randomDiceSource,
        onRollRequest = () => {
            //
        },
        ...listeners
    } = props
    const matchLength = 0
    const { sgState: initialSGState, cbState: initialCBState } = toState(setup)
    const { sgState, setSGState } = useSingleGameState(initialSGState)
    const { cbState, setCBState } = useCubeGameState(initialCBState)
    const { matchState, matchStateAddOn } = useMatchState(
        matchScore,
        matchLength,
        gameConf
    )
    const defaultState = defaultBGState(gameConf)
    const [cpState, cpListeners] = useCheckerPlayListeners(undefined, props)
    const rollListener = rollListeners({
        isRollHandlerEnabled,
        diceSource,
        rollListener: { onRollRequest },
    })

    const mayResign = mayResignOrNot(cbState)

    const { resignState, resignStateAddOn, resignEventHandlers } =
        useResignState(mayResign, autoOperators)
    const { handlers } = cubefulGameEventHandlers(
        false,
        defaultState,
        setSGState,
        setCBState,
        rollListener,
        matchStateAddOn,
        resignStateAddOn,
        { eventHandlers: {}, listeners: props }
    )

    useCBAutoOperator(cbState, sgState, autoOperators, handlers)

    const cbProps: CubefulGameProps = {
        resignState,
        bgState: { sgState, cbState },
        cpState,
        ...listeners,
        matchState,
        ...handlers,
        ...cpListeners,
        ...resignEventHandlers,
    }

    return <CubefulGame {...cbProps} />
}
