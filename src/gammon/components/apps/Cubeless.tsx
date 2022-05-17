import { useState } from 'react'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGEoG, SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { Score, score } from 'tsgammon-core/Score'
import { BoardEventHandlers } from '../boards/Board'
import { SingleGameEventHandlers, StartNextGameHandler } from '../EventHandlers'
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
    const { sgState, handlers } = useCubelessGameState(
        gameConf,
        initialSGState,
        rollListeners(),
        listeners,
        matchScoreListener
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

export function useCubelessGameState(
    gameConf: GameConf,
    initialSGState: SGState,
    rollListener: RollListener = rollListeners(),
    ...listeners: Partial<SingleGameListeners>[]
): {
    sgState: SGState
    handlers: SingleGameEventHandlers & StartNextGameHandler
} {
    const { sgState, setSGState } = useSingleGameState(gameConf, initialSGState)

    const sgEventHandlers = singleGameEventHandlers(
        rollListener,
        singleGameListeners(setSGState, ...listeners)
    )

    const gameEventHandlers: StartNextGameHandler = {
        onStartNextGame: () => {
            setSGState()
        },
    }
    const handlers = { ...sgEventHandlers, ...gameEventHandlers }
    return { sgState, handlers }
}

function useMatchScore(): {
    matchScore: Score
    matchScoreListener: Pick<SingleGameListeners, 'onEndOfGame'>
} {
    const [matchScore, setMatchScore] = useState(score())
    const onEndOfGame = (sgEoG: SGEoG) => {
        setMatchScore((prev) => prev.add(sgEoG.stake))
    }
    return { matchScore, matchScoreListener: { onEndOfGame } }
}
