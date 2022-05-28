import { GameConf, Score, score, standardConf } from 'tsgammon-core'
import { toState } from 'tsgammon-core/dispatchers/BGState'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { cubefulGameEventHandlers } from 'tsgammon-core/dispatchers/cubefulGameEventHandlers'
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    RollListener,
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { CubefulGameConfs } from '../CubefulGameBoard'
import { CBOperator } from '../operators/CBOperator'
import { SGOperator } from '../operators/SGOperator'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useCubeGameState } from '../useCubeGameState'
import { useMatchStateForCubeGame } from '../useMatchStateForCubeGame'
import { useSingleGameState } from '../useSingleGameState'

export type MoneyGameProps = {
    gameConf: GameConf
    matchScore?: Score
    setup?: GameSetup
    autoOperator?: { cb?: CBOperator; sg?: SGOperator }
    cbConfs?: CubefulGameConfs
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
    const { matchState, matchStateAddOn } = useMatchStateForCubeGame(
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

    const { handlers } = cubefulGameEventHandlers(
        false,
        defaultState,
        setSGState,
        setCBState,
        rollListener,
        matchStateAddOn,
        { eventHandlers: {}, listeners: props }
    )

    const cbProps: CubefulGameProps = {
        bgState: { sgState, cbState },
        cpState,
        ...listeners,
        matchState,
        ...handlers,
        ...cpListeners,
    }

    return <CubefulGame {...cbProps} />
}
