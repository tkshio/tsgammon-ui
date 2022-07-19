import { GameConf, Score, score, standardConf } from 'tsgammon-core'
import { setBGStateListener } from 'tsgammon-core/dispatchers/BGEventHandler'
import { toState } from 'tsgammon-core/dispatchers/BGState'
import { buildBGEventHandler } from 'tsgammon-core/dispatchers/buildBGEventHandler'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    RollListener,
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { operateWithBG } from '../operateWithBG'
import { CBOperator } from '../operators/CBOperator'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { useBGState } from '../useBGState'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useMatchState } from '../useMatchState'

export type MoneyGameProps = {
    gameConf: GameConf
    matchScore?: Score
    setup?: GameSetup
    autoOperators?: { cb?: CBOperator; sg?: SGOperator; rs?: RSOperator }
    isRollHandlerEnabled?: boolean
    diceSource?: DiceSource
} & Partial<
        RollListener
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
    const initialBGState = toState(setup)
    const { bgState, setBGState } = useBGState(initialBGState)
    const { matchState, matchStateAddOn } = useMatchState(
        matchScore,
        matchLength,
        gameConf
    )
    const [cpState, cpListeners] = useCheckerPlayListeners(undefined)
    const rollListener = rollListeners({
        isRollHandlerEnabled,
        diceSource,
        rollListener: { onRollRequest },
    })

    const _handlers = buildBGEventHandler(
        false,
        rollListener,
        setBGStateListener(defaultBGState(gameConf), setBGState),
        matchStateAddOn
    )

    const handlers = operateWithBG(autoOperators, _handlers)
    const cbProps: CubefulGameProps = {
        bgState,
        cpState,
        ...listeners,
        matchState,
        ...handlers,
        ...cpListeners,
    }

    return <CubefulGame {...cbProps} />
}
