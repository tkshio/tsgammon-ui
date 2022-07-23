import { useState } from 'react'
import { EOGStatus } from 'tsgammon-core'
import { buildSGEventHandler } from 'tsgammon-core/dispatchers/buildSGEventHandler'
import { eogEventHandlersSG } from 'tsgammon-core/dispatchers/EOGEventHandlers'
import {
    rollListener
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { setSGStateListener } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SingleGameListener } from 'tsgammon-core/dispatchers/SingleGameListener'
import { SGEoG } from 'tsgammon-core/dispatchers/SingleGameState'
import { toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { Score, score } from 'tsgammon-core/Score'
import { operateWithSGandRS } from '../operateWithRS'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useResignState } from '../useResignState'
import { useSingleGameState } from '../useSingleGameState'
import { BGCommonProps } from './BGCommonProps'

export type SimpleCubelessProps = BGCommonProps & {
    autoOperators?: { sg?: SGOperator; rs?: RSOperator }
}
export function SimpleCubeless(props: SimpleCubelessProps) {
    const {
        autoOperators = {},
        diceSource,
        onRollRequest,
        gameSetup,
        ..._listeners
    } = props
    const initialSGState = toSGState(gameSetup)
    const { matchScore, matchScoreListener } = useMatchScore()
    const { sgState, setSGState } = useSingleGameState(initialSGState)

    const rListener = rollListener({
        diceSource,
        onRollRequest,
    })
    const listeners: Partial<SingleGameListener>[] = [
        setSGStateListener(initialSGState, setSGState),
        matchScoreListener,
        _listeners,
    ]
    const _handlers = buildSGEventHandler(rListener, ...listeners)

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

    return (
        <div id="main">
            <div id="boardPane">
                <SingleGame {...sgProps} />
            </div>
        </div>
    )
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
