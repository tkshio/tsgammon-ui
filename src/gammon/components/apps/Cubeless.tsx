import { useState } from 'react'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    RollListener,
    rollListeners
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGEoG } from 'tsgammon-core/dispatchers/SingleGameState'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { score } from 'tsgammon-core/Score'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import { SingleGame, SingleGameProps } from '../SingleGame'
import {
    SingleGameConfs
} from '../SingleGameBoard'
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

export function Cubeless(props: CubelessProps) {
    const { gameConf = standardConf, sgConfs, ...listeners } = props

    const rollListener = rollListeners({
        isRollHandlerEnabled: false,
        diceSource: randomDiceSource,
    })

    const { sgState, singleGameEventHandlers } = useSingleGameState(
        gameConf,
        toSGState(props),
        rollListener,
        props
    )

    const [cpState, cpListeners] = useCheckerPlayListeners()
    const [matchScore, setMatchScore] = useState(score())

    const sgProps: SingleGameProps = {
        sgState,
        cpState,
        sgConfs,
        matchScore,
        onStartNextGame: (sgState: SGEoG) => {
            doReset(sgState)
        },
        ...listeners,
        ...singleGameEventHandlers,
        ...cpListeners,
    }

    function doReset(sgState: SGEoG) {
        setMatchScore((prev) => prev.add(sgState.stake))
    }

    return <SingleGame {...sgProps} />
}
