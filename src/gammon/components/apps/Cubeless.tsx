import { useState } from 'react'
import { EOGStatus } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { defaultSGState } from 'tsgammon-core/dispatchers/defaultStates'
import {
    RollListener,
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { buildSGEventHandlers } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import { SGEoG } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { Score, score } from 'tsgammon-core/Score'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { OperationConfs } from '../SingleGameBoard'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useResignState } from '../useResignState'
import { useSGAutoOperator } from '../useSGAutoOperator'
import { useSingleGameState } from '../useSingleGameState'
import {
    addOnWithRSAutoOperator,
    handlersWithRSAutoOperator
} from '../withRSAutoOperator'

export type CubelessProps = {
    gameConf?: GameConf
    autoOperators?: { sg?: SGOperator; rs?: RSOperator }
    sgConfs?: OperationConfs
    isRollHandlerEnabled?: boolean
    diceSource: DiceSource
} & GameSetup &
    Partial<
        SingleGameListeners &
            RollListener &
            CheckerPlayListeners &
            BoardEventHandlers
    >

export function Cubeless(props: CubelessProps) {
    const {
        gameConf = standardConf,
        sgConfs,
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

    const { resignState, resignEventHandlers } = useResignState()

    const { handlers } = buildSGEventHandlers(
        defaultSGState(gameConf),
        setSGState,
        rollListener,
        { eventHandlers: {}, listeners },
        { eventHandlers: {}, listeners: matchScoreListener },
        addOnWithRSAutoOperator(autoOperators.rs, resignEventHandlers)
    )
    useSGAutoOperator(sgState, autoOperators.sg, handlers)

    const [cpState, cpListeners] = useCheckerPlayListeners()

    const sgProps: SingleGameProps = {
        resignState,
        sgState,
        cpState,
        opConfs: sgConfs,
        matchScore,
        ...handlers,
        ...handlersWithRSAutoOperator(
            autoOperators.rs,
            resignEventHandlers,
            (result: SGResult, eogStatus: EOGStatus) =>
                handlers.onEndGame(sgState, result, eogStatus),
            sgState
        ),
        ...cpListeners,
    }

    return <SingleGame {...sgProps} />
}

export function useMatchScore(): {
    matchScore: Score
    matchScoreListener: Pick<SingleGameListeners, 'onEndOfGame'>
} {
    const [matchScore, setMatchScore] = useState(score())
    const onEndOfGame = (sgEoG: SGEoG) => {
        setMatchScore((prev: Score) => prev.add(sgEoG.stake))
    }
    return { matchScore, matchScoreListener: { onEndOfGame } }
}
