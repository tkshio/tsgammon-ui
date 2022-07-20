import { useState } from 'react'
import { EOGStatus } from 'tsgammon-core'
import { buildSGEventHandler } from 'tsgammon-core/dispatchers/buildSGEventHandler'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { eogEventHandlersSG } from 'tsgammon-core/dispatchers/EOGEventHandlers'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { setSGStateListener } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SingleGameListener } from 'tsgammon-core/dispatchers/SingleGameListener'
import { SGEoG } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf } from 'tsgammon-core/GameConf'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { Score, score } from 'tsgammon-core/Score'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import { operateWithSGandRS } from '../operateWithRS'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useResignState } from '../useResignState'
import { useSingleGameState } from '../useSingleGameState'

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
        ..._listeners
    } = props
    const initialSGState = toSGState(props)
    const { matchScore, matchScoreListener } = useMatchScore()
    const { sgState, setSGState } = useSingleGameState(initialSGState)
    
    const rollListener = rollListeners({
        isRollHandlerEnabled,
        diceSource,
        rollListener: { onRollRequest },
    })
    const listeners: Partial<SingleGameListener>[] = [
        setSGStateListener(initialSGState, setSGState),
        matchScoreListener,
        _listeners
    ]
    const _handlers = buildSGEventHandler(
        rollListener,
        ...listeners
    )

    const { resignState, rsDialogHandler: rsHandler } = useResignState(
        (result: SGResult, eog: EOGStatus) =>
        eogEventHandlersSG(...listeners).onEndOfGame(sgState, result, eog)
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
