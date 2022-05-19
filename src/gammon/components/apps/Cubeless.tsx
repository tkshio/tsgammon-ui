import { useState } from 'react'
import { BoardStateNode } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    decorate,
    SingleGameListeners,
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    SGEoG,
    SGInPlay,
    SGOpening,
    SGState,
    SGToRoll,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { Score, score } from 'tsgammon-core/Score'
import { BoardEventHandlers } from '../boards/Board'
import { SingleGameEventHandlers } from '../EventHandlers'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { SingleGameConfs } from '../SingleGameBoard'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import {
    singleGameEventHandlers,
    singleGameListeners,
    useSingleGameState,
} from '../useSingleGameState'

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

    const { handlers } = cubelessEventHandlers(
        gameConf,
        setSGState,
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

type EventHandlerAddOn = {
    eventHandlers: Partial<SingleGameEventHandlers>
    listeners: Partial<SingleGameListeners>
}

type EventHandlerBuilder = (
    addOn: EventHandlerAddOn
) => SingleGameEventHandlers

export function cubelessEventHandlers(
    gameConf: GameConf,
    setSGState: (sgState: SGState) => void,
    rollListener: RollListener = rollListeners(),
    ...addOns: EventHandlerAddOn[]
): {
    handlers: SingleGameEventHandlers
} {
    const builder:EventHandlerBuilder = singleGameEventHandlers(rollListener)

    const finalBuilder = addOns.reduce(
        (prev, cur) => prev.addOn(cur),
        wrap(builder)
    )

    const handlers = finalBuilder.build(singleGameListeners(gameConf, setSGState))
    return { handlers }
}

type WrappedBuilder = {
    builder: EventHandlerBuilder
    addOn: (n: EventHandlerAddOn) => WrappedBuilder
    build: (
        setStateListener: SingleGameListeners
    ) => SingleGameEventHandlers
}

function wrap(
    base: EventHandlerBuilder,
    addOn?: {
        eventHandlers: Partial<SingleGameEventHandlers>
        listeners: Partial<SingleGameListeners>
    }
): WrappedBuilder {
    const builder = addOn ? concatAddOns(base, addOn) : base
    return {
        builder,
        addOn: (newAddOn: EventHandlerAddOn) => wrap(builder, newAddOn),
        build: (setStateListener: SingleGameListeners) =>
            builder({ eventHandlers: {}, listeners: setStateListener }),
    }
}

function concatAddOns(
    builder: EventHandlerBuilder,
    h: EventHandlerAddOn
): EventHandlerBuilder {
    return (addOn: EventHandlerAddOn) => {
        const { eventHandlers, listeners } = addOn
        return builder({
            eventHandlers: {
                ...eventHandlers,
                onStartGame: () => {
                    if (eventHandlers.onStartGame) {
                        eventHandlers.onStartGame()
                    }
                    if (h.eventHandlers.onStartGame) {
                        h.eventHandlers.onStartGame()
                    }
                },
                onCommit: (sgState: SGInPlay, node: BoardStateNode) => {
                    if (eventHandlers.onCommit) {
                        eventHandlers.onCommit(sgState, node)
                    }
                    if (h.eventHandlers.onCommit) {
                        h.eventHandlers.onCommit(sgState, node)
                    }
                },
                onRoll: (sgState: SGToRoll) => {
                    if (eventHandlers.onRoll) {
                        eventHandlers.onRoll(sgState)
                    }
                    if (h.eventHandlers.onRoll) {
                        h.eventHandlers.onRoll(sgState)
                    }
                },
                onRollOpening: (sgState: SGOpening) => {
                    if (eventHandlers.onRollOpening) {
                        eventHandlers.onRollOpening(sgState)
                    }
                    if (h.eventHandlers.onRollOpening) {
                        h.eventHandlers.onRollOpening(sgState)
                    }
                },
            },
            listeners: decorate(listeners, h.listeners),
        })
    }
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
