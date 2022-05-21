import { useState } from 'react'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    concatSGListeners,
    singleGameDispatcher,
    SingleGameDispatcher,
    SingleGameListeners,
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGEoG, SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { Score, score } from 'tsgammon-core/Score'
import { BoardEventHandlers } from '../boards/Board'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { SingleGameConfs } from '../SingleGameBoard'
import {
    concatSGHandlers as concatSGEventHandlers,
    sgEventHandlersBuilder,
    SingleGameEventHandlers,
} from '../SingleGameEventHandlers'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { singleGameListeners, useSingleGameState } from '../useSingleGameState'
import { EventHandlerAddOn, wrap } from '../EventHandlerBuilder'

export type CubelessProps = {
    gameConf?: GameConf
    sgConfs?: SingleGameConfs
} & GameSetup &
    Partial<
        SingleGameListeners &
            RollListener & // TODO: 使われていない(isRollHandlerEnabledが必要)
            CheckerPlayListeners &
            BoardEventHandlers
    >

export function Cubeless(props: CubelessProps) {
    const { gameConf = standardConf, sgConfs, ...listeners } = props
    const initialSGState = toSGState(props)
    const { matchScore, matchScoreListener } = useMatchScore()
    const { sgState, setSGState } = useSingleGameState(initialSGState)
    const dispatcher: SingleGameDispatcher = singleGameDispatcher()

    const { handlers } = cubelessEventHandlers(
        gameConf,
        setSGState,
        dispatcher,
        rollListeners(),
        { eventHandlers: {}, listeners },
        { eventHandlers: {}, listeners: matchScoreListener }
    )
    const [cpState, cpListeners] = useCheckerPlayListeners()

    const sgProps: SingleGameProps = {
        sgState,
        cpState,
        sgConfs,
        matchScore,
        ...handlers,
        ...cpListeners,
    }

    return <SingleGame {...sgProps} />
}

export type SGEventHandlerAddOn = EventHandlerAddOn<
    SingleGameEventHandlers,
    SingleGameListeners
>

export function cubelessEventHandlers(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    sgDispatcher: SingleGameDispatcher,
    rollListener: RollListener = rollListeners(),
    ...addOns: SGEventHandlerAddOn[]
): {
    handlers: SingleGameEventHandlers
} {
    const builder = sgEventHandlersBuilder(sgDispatcher, rollListener)

    const finalBuilder = addOns.reduce(
        (prev, cur) => prev.addOn(cur),
        wrap(builder, concatSGEventHandlers, concatSGListeners)
    )

    return finalBuilder.build(singleGameListeners(gameConf, setSGState))
}

export function useMatchScore(): {
    matchScore: Score
    matchScoreListener: Pick<SingleGameListeners, 'onEndOfGame'>
} {
    const [matchScore, setMatchScore] = useState(score())
    const onEndOfGame = (sgEoG: SGEoG) => {
        setMatchScore((prev) => prev.add(sgEoG.stake))
    }
    return { matchScore, matchScoreListener: { onEndOfGame } }
}
