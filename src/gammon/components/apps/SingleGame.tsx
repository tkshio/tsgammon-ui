import { useState } from 'react'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import {
    RollListener,
    rollListeners,
} from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { score, Score } from 'tsgammon-core/Score'
import { randomDiceSource } from 'tsgammon-core/utils/DiceSource'
import { BoardEventHandlers } from '../boards/Board'
import {
    SingleGameBoard,
    SingleGameBoardProps,
    SingleGameConfs,
} from '../SingleGameBoard'
import { EOGDialog } from '../uiparts/EOGDialog'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useSingleGameState } from '../useSingleGameState'

export type SingleGameProps = {
    gameConf?: GameConf
    sgConfs?: SingleGameConfs
} & GameSetup &
    Partial<
        SingleGameListeners &
            RollListener & // TODO: 使われていない
            CheckerPlayListeners &
            BoardEventHandlers
    >

export function SingleGame(props: SingleGameProps) {
    const { gameConf = standardConf, sgConfs } = props

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
    const [gameScore, setGameScore] = useState(score())

    const dialog =
        sgState.tag === 'SGEoG' ? (
            <EOGDialog
                {...{
                    stake: sgState.stake,
                    eogStatus: sgState.eogStatus,
                    score: gameScore.add(sgState.stake),
                    onClick: () => {
                        doReset(gameScore.add(sgState.stake))
                    },
                }}
            />
        ) : undefined

    const sgProps: SingleGameBoardProps = {
        ...props,
        sgState,
        cpState,
        sgConfs,
        dialog,
        ...singleGameEventHandlers,
        ...cpListeners,
    }

    function doReset(scoreAfter: Score) {
        singleGameEventHandlers.onReset()
        setGameScore(scoreAfter)
    }

    return <SingleGameBoard {...sgProps} />
}
