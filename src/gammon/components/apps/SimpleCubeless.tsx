import { useState } from 'react'
import { Score, score } from 'tsgammon-core/Score'
import { SGEoG } from 'tsgammon-core/states/SingleGameState'
import { SingleGameListener } from '../dispatchers/SingleGameListener'
import { operateWithSG } from '../operateWithSG'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { BGCommonProps } from './BGCommonProps'
import { useCubeless } from './useCubeless'

export type SimpleCubelessProps = BGCommonProps & {
    autoOperators?: { sg?: SGOperator; rs?: RSOperator }
} & Partial<SingleGameListener>
export function SimpleCubeless(props: SimpleCubelessProps) {
    const { autoOperators = {}, gameConf } = props

    const { matchScore, matchScoreListener } = useMatchScore()

    const { sgState, cpState, handler, cpListener } = useCubeless(props)

    const handlerWithOp = operateWithSG(
        autoOperators.sg,
        handler.addListeners(matchScoreListener)
    )

    const sgProps: SingleGameProps = {
        sgState,
        cpState,
        matchScore,
        gameConf,
        ...handlerWithOp,
        ...cpListener,
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
