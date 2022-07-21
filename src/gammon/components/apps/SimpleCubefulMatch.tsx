import { GameConf, Score, score, standardConf } from 'tsgammon-core'
import { setBGStateListener } from 'tsgammon-core/dispatchers/BGEventHandler'
import { toState } from 'tsgammon-core/dispatchers/BGState'
import { buildBGEventHandler } from 'tsgammon-core/dispatchers/buildBGEventHandler'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { GameSetup } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { operateWithBG } from '../operateWithBG'
import { CBOperator } from '../operators/CBOperator'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { PlayersConf } from '../uiparts/PlayersConf'
import { useBGState } from '../useBGState'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useMatchState } from '../useMatchState'

export type SimpleCubefulMatchProps = {
    gameConf: GameConf
    matchScore?: Score
    matchLength?: number
    playersConf: PlayersConf
    setup?: GameSetup
    autoOperators?: { cb?: CBOperator; sg?: SGOperator; rs?: RSOperator }
    isRollHandlerEnabled?: boolean
    diceSource?: DiceSource
} & Partial<RollListener>

export function SimpleCubefulMatch(props: SimpleCubefulMatchProps) {
    const {
        matchScore = score(),
        matchLength = 0,
        playersConf,
        setup,
        autoOperators = { cb: undefined, sg: undefined },
        isRollHandlerEnabled = false,
        diceSource = randomDiceSource,
        onRollRequest = () => {
            //
        },
        ...listeners
    } = props
    const gameConf = { ...standardConf, jacobyRule: matchLength === 0 }
    const initialBGState = toState(setup)
    const { bgState, setBGState } = useBGState(initialBGState)
    const [cpState, cpListeners] = useCheckerPlayListeners(undefined)

    const { matchState, matchStateListener: matchStateAddOn } = useMatchState(
        gameConf,
        matchLength,
        matchScore
    )
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
        matchState,
        playersConf,
        ...listeners,
        ...handlers,
        ...cpListeners,
    }

    return (
        <div id="main">
            <div id="boardPane">
                <CubefulGame {...cbProps} />
            </div>
        </div>
    )
}
