import { useState } from 'react'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { GameSetup, toSGState } from 'tsgammon-core/dispatchers/utils/GameSetup'
import { GameConf, standardConf } from 'tsgammon-core/GameConf'
import { score, Score } from 'tsgammon-core/Score'
import { BoardEventHandlers } from '../boards/Board'
import {
    SingleGameBoard,
    SingleGameBoardProps,
    SingleGameConfs,
} from '../SingleGameBoard'
import { EOGDialog } from '../uiparts/EOGDialog'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { useSingleGameListeners } from '../useSingleGameListeners'

export type SingleGameProps = {
    gameConf?: GameConf
    sgConfs?: SingleGameConfs
} & GameSetup &
    Partial<
        SingleGameListeners &
            RollListener &
            CheckerPlayListeners &
            BoardEventHandlers
    >

export function SingleGame(props: SingleGameProps) {
    const { gameConf = standardConf, sgConfs, ...state } = props
    const initialSGState = toSGState(state)
    const [sgState, sgListeners, setSGState] = useSingleGameListeners(
        initialSGState,
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
        ...sgListeners,
        ...cpListeners,
    }

    function doReset(scoreAfter: Score) {
        const state = toSGState({ absPos: gameConf.initialPos })
        setSGState(state)
        setGameScore(scoreAfter)
    }

    return <SingleGameBoard {...sgProps} />
}
