import { useState } from 'react'
import { GameConf, score, Score, standardConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CubeGameListeners } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { rollListeners } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import {
    GameSetup,
    toCBState,
    toSGState,
} from 'tsgammon-core/dispatchers/utils/GameSetup'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { CubefulGameConfs } from '../CubefulGameBoard'
import { StartNextGameHandler } from '../EventHandlers'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useCubeGameState } from '../useCubeGameState'
export type MoneyGameProps = {
    gameConf: GameConf
    state?: GameSetup
    cbConfs?: CubefulGameConfs
} & Partial<
    CubeGameListeners &
        SingleGameListeners &
        CheckerPlayListeners &
        BoardEventHandlers
>
export function useScoreForCubefulGame(
    cbState: CBState,
    stakeConf: StakeConf,
    startNextGameHandler: StartNextGameHandler
): {
    matchScore: Score
    gameEventHandlers: StartNextGameHandler
} {
    const [matchScore, setMatchScore] = useState(score())

    return {
        matchScore,
        gameEventHandlers: {
            onStartNextGame: () => {
                if (cbState.tag === 'CBEoG') {
                    const { stake } = cbState.calcStake(stakeConf)
                    setMatchScore((prev) => prev.add(stake))
                }
                startNextGameHandler.onStartNextGame()
            },
        },
    }
}

export function MoneyGame(props: MoneyGameProps) {
    const { gameConf = { ...standardConf, jacobyRule: true }, state } = props
    const initialCBState = toCBState(state)
    const initialSGState = toSGState(state)
    const rollListener = rollListeners({
        isRollHandlerEnabled: false,
        diceSource: randomDiceSource,
    })

    const [cpState, cpListeners] = useCheckerPlayListeners(undefined, props)
    const {
        cbState,
        sgState,
        eventHandlers,
        gameEventHandlers: _gameEventHandlers,
    } = useCubeGameState(
        gameConf,
        false,
        initialSGState,
        initialCBState,
        rollListener,
        props
    )
    const { matchScore, gameEventHandlers } = useScoreForCubefulGame(
        cbState,
        gameConf,
        _gameEventHandlers
    )
    const cbProps: CubefulGameProps = {
        cbState,
        sgState,
        cpState,
        ...props,
        matchLength: 0,
        matchScore,
        ...gameEventHandlers,
        ...eventHandlers,
        ...cpListeners,
    }

    return <CubefulGame {...cbProps} />
}
