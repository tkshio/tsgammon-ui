import { useState } from 'react'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { Score, score } from 'tsgammon-core/Score'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import { GameEventHandlers } from '../EventHandlers'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { SingleGameConfs } from '../SingleGameBoard'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useSingleGameState } from '../useSingleGameState'

export type CubelessProps = {
    gameConf?: GameConf
    sgConfs?: SingleGameConfs
} & GameSetup &
    Partial<
        SingleGameListeners &
            RollListener & // TODO: 使われていない
            CheckerPlayListeners &
            BoardEventHandlers
    >
export function useScoreForSingleGame(
    sgState: SGState,
    gameEventHandlers: Partial<GameEventHandlers>
): {
    matchScore: Score
    gameEventHandlers: Pick<GameEventHandlers, 'onStartNextGame'> &
        Partial<Omit<GameEventHandlers, 'onStartNextGame>'>>
} {
    const [matchScore, setMatchScore] = useState(score())
    return {
        matchScore,
        gameEventHandlers: {
            ...gameEventHandlers,
            onStartNextGame: () => {
                if (sgState.tag === 'SGEoG') {
                    setMatchScore((prev) => prev.add(sgState.stake))
                }
                if (gameEventHandlers.onStartNextGame) {
                    gameEventHandlers.onStartNextGame()
                }
            },
        },
    }
}

export function Cubeless(props: CubelessProps) {
    const { gameConf = standardConf, sgConfs, ...listeners } = props

    const rollListener = rollListeners({
        isRollHandlerEnabled: false,
        diceSource: randomDiceSource,
    })

    const {
        sgState,
        singleGameEventHandlers,
        gameEventHandlers: _gameEventHandlers,
    } = useSingleGameState(gameConf, toSGState(props), rollListener, props)
    const { matchScore, gameEventHandlers } = useScoreForSingleGame(
        sgState,
        _gameEventHandlers
    )
    const [cpState, cpListeners] = useCheckerPlayListeners()

    const sgProps: SingleGameProps = {
        sgState,
        cpState,
        sgConfs,
        matchScore,
        ...gameEventHandlers,
        ...listeners,
        ...singleGameEventHandlers,
        ...cpListeners,
    }

    return <SingleGame {...sgProps} />
}
