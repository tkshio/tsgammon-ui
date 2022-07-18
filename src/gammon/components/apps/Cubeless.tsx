import { useState } from 'react'
import { EOGStatus } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { eogEventHandlersSG } from 'tsgammon-core/dispatchers/EOGEventHandlers'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    setSGStateListener,
    SingleGameListener,
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import {
    buildSGEventHandler,
} from 'tsgammon-core/dispatchers/buildSGEventHandler'
import {
    SGEoG,
} from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf } from 'tsgammon-core/GameConf'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { Score, score } from 'tsgammon-core/Score'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useResignState } from '../useResignState'
import { useSingleGameState } from '../useSingleGameState'
import { operateWithSGandRS } from '../operateWithRS'

export type CubelessProps = {
    gameConf?: GameConf
    autoOperators?: { sg?: SGOperator; rs?: RSOperator }
    isRollHandlerEnabled?: boolean
    diceSource: DiceSource
} & GameSetup &
    Partial<
        SingleGameListener &
            RollListener &
            CheckerPlayListeners &
            BoardEventHandlers
    >

export function Cubeless(props: CubelessProps) {
    const {
        autoOperators = {},
        isRollHandlerEnabled = false,
        diceSource = randomDiceSource,
        onRollRequest = () => {
            //
        },
        ...listeners
    } = props
    const initialSGState = toSGState(props)
    const { matchScore, matchScoreListener } = useMatchScore()
    const { sgState, setSGState } = useSingleGameState(initialSGState)
    const rollListener = rollListeners({
        isRollHandlerEnabled,
        diceSource,
        rollListener: { onRollRequest },
    })

    const _handlers = buildSGEventHandler(
        rollListener,
        setSGStateListener(initialSGState, setSGState)
    )
        .addListeners(listeners)
        .addListeners(matchScoreListener)

    const eogHandler = eogEventHandlersSG([listeners])
    const { resignState, rsDialogHandler:rsHandler } =
        useResignState((result: SGResult, eog: EOGStatus) =>
            eogHandler.onEndOfGame(sgState, result, eog)
        )
    const { sgHandler, rsDialogHandler } = operateWithSGandRS(
        autoOperators,
        sgState,
        rsHandler,
        _handlers
    )

    const [cpState, cpListeners] = useCheckerPlayListeners()

    const sgProps: SingleGameProps = {
        resignState,
        sgState,
        cpState,
        matchScore,
        ...sgHandler,
        ...rsDialogHandler,
        ...cpListeners,
    }

    return <SingleGame {...sgProps} />
}
export function useMatchScore(): {
    matchScore: Score
    matchScoreListener: Pick<SingleGameListener, 'onEndOfGame'>
} {
    const [matchScore, setMatchScore] = useState(score())
    const onEndOfGame = (sgEoG: SGEoG) => {
        setMatchScore((prev: Score) => prev.add(sgEoG.stake))
    }
    return { matchScore, matchScoreListener: { onEndOfGame } }
}
