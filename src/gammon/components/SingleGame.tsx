import { Fragment } from 'react'
import { score, Score } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGEoG, SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import {
    SingleGameBoard,
    SingleGameBoardProps,
    SingleGameConfs,
    SingleGameEventHandlers,
} from './SingleGameBoard'
import { EOGDialog } from './uiparts/EOGDialog'
import { PlyInfo } from './uiparts/PlyInfo'

export type SingleGameProps = {
    cpState?: CheckerPlayState
    sgState: SGState
    sgConfs?: SingleGameConfs
    matchScore?: Score
    dialog?: JSX.Element
    onStartNextGame?: (sgState: SGEoG) => void
    onResumeState?: (index: number, state: SGState) => void
} & Partial<SingleGameEventHandlers & CheckerPlayListeners & RollListener>

export function SingleGame(props: SingleGameProps) {
    const {
        cpState,
        sgState,
        sgConfs = {},
        matchScore = score(),
        dialog,
        onStartNextGame = (_: SGEoG) => {
            //
        },
        ...listeners
    } = props

    const eogDialog =
        dialog ??
        (sgState.tag === 'SGEoG' ? (
            <EOGDialog
                stake={sgState.stake}
                eogStatus={sgState.eogStatus}
                score={matchScore}
                onClick={() => {
                    if (listeners.onReset) {
                        listeners.onReset()
                    }
                    if (onStartNextGame) {
                        onStartNextGame(sgState)
                    }
                }}
            />
        ) : undefined)

    const singleGameProps: SingleGameBoardProps = {
        sgState,
        cpState,
        sgConfs,
        dialog: eogDialog,
        ...listeners,
    }
    const plyInfoProps = {
        sgState,
        cpState,
        score: matchScore,
    }

    return (
        <Fragment>
            <SingleGameBoard {...singleGameProps} />
            <PlyInfo {...plyInfoProps} />
        </Fragment>
    )
}
