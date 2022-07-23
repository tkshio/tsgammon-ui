import { Score, score, standardConf } from 'tsgammon-core'
import { setBGStateListener } from 'tsgammon-core/dispatchers/BGEventHandler'
import { toState } from 'tsgammon-core/dispatchers/BGState'
import { buildBGEventHandler } from 'tsgammon-core/dispatchers/buildBGEventHandler'
import { defaultBGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    rollListener
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { operateWithBG } from '../operateWithBG'
import { CBOperator } from '../operators/CBOperator'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { useBGState } from '../useBGState'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useMatchState } from '../useMatchState'
import { BGCommonProps } from './BGCommonProps'

export type SimpleCubefulMatchProps = BGCommonProps & {
    matchScore?: Score
    matchLength?: number
    autoOperators?: { cb?: CBOperator; sg?: SGOperator; rs?: RSOperator }
}
export function SimpleCubefulMatch(props: SimpleCubefulMatchProps) {
    const {
        matchScore = score(),
        matchLength = 0,
        playersConf,
        gameSetup,
        autoOperators = { cb: undefined, sg: undefined },
        diceSource ,
        onRollRequest,
        ...listeners
    } = props
    const gameConf = { ...standardConf, jacobyRule: matchLength === 0 }
    const initialBGState = toState(gameSetup)
    const { bgState, setBGState } = useBGState(initialBGState)
    const [cpState, cpListeners] = useCheckerPlayListeners(undefined)

    const { matchState, matchStateListener: matchStateAddOn } = useMatchState(
        gameConf,
        matchLength,
        matchScore
    )
    const rListener = rollListener({
        diceSource,
        onRollRequest,
    })

    const _handlers = buildBGEventHandler(
        false,
        rListener,
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
