import { useState } from 'react'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    SingleGameListeners,
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGEoG } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { Score, score } from 'tsgammon-core/Score'
import { BoardEventHandlers } from '../boards/Board'
import { defaultSGState } from '../defaultStates'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { SingleGameConfs } from '../SingleGameBoard'
import { buildSGEventHandlers } from '../eventHandlers/SingleGameEventHandlers'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useSingleGameState } from '../useSingleGameState'
import { SGOperator } from '../operators/SGOperator'
import { useSGAutoOperator } from '../useSGAutoOperator'
import { DiceSource, randomDiceSource } from 'tsgammon-core/utils/DiceSource'

export type CubelessProps = {
    gameConf?: GameConf
    autoOperator?: SGOperator
    sgConfs?: SingleGameConfs
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
        autoOperator,
        isRollHandlerEnabled = false,
        diceSource = randomDiceSource,
        onRollRequest = ()=>{
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

    const { handlers } = buildSGEventHandlers(
        defaultSGState(gameConf),
        setSGState,
        rollListener,
        { eventHandlers: {}, listeners },
        { eventHandlers: {}, listeners: matchScoreListener }
    )
    useSGAutoOperator(sgState, autoOperator, handlers)

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
