import { useState } from 'react';
import { GameConf, standardConf } from "tsgammon-core/GameConf";
import { score as initScore, Score } from 'tsgammon-core/Score';
import { CheckerPlayListeners } from '../../dispatchers/CheckerPlayDispatcher';
import { RollListener } from '../../dispatchers/RollDispatcher';
import { SingleGameListeners } from '../../dispatchers/SingleGameDispatcher';
import { GameState, toSGState } from '../../dispatchers/utils/GameState';
import { BoardEventHandlers } from '../boards/Board';
import { SingleGameBoard, SingleGameBoardProps, SingleGameConfs } from '../SingleGameBoard';
import { EOGDialog } from '../uiparts/EOGDialog';
import { useCheckerPlayListeners } from '../useCheckerPlayListeners';
import { useSingleGameListeners } from '../useSingleGameListeners';



export type SingleGameProps = {
    gameConf?: GameConf
    sgConfs?: SingleGameConfs
}
    & GameState
    & Partial<
        SingleGameListeners
        & RollListener
        & CheckerPlayListeners
        & BoardEventHandlers
    >

export function SingleGame(props: SingleGameProps) {
    const { gameConf = standardConf, sgConfs, ...state } = props
    const initialSGState = toSGState(state)
    const [sgState, sgListeners, setSGState] = useSingleGameListeners(initialSGState, props)
    const [cpState, cpListeners] = useCheckerPlayListeners()
    const [score, setScore] = useState(initScore())

    const sgProps: SingleGameBoardProps = {
        ...props,
        sgState,
        cpState,
        sgConfs,
        ...sgListeners,
        ...cpListeners
    }

    function doReset(scoreAfter: Score) {
        const state = toSGState({ absPos: gameConf.initialPos })
        setSGState(state)
        setScore(scoreAfter)
    }

    return (
        <div className='boardContainer'>
            <SingleGameBoard {...sgProps} />
            {(sgState.tag === "SGEoG") &&
                <EOGDialog {...{
                    stake: sgState.stake,
                    eogStatus: sgState.eogStatus,
                    score: score.add(sgState.stake),
                    onClick: () => {
                        doReset(score.add(sgState.stake))
                    }
                }}
                />}
        </div>
    )
}
