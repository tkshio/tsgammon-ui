import { Fragment } from 'react'
import { score, Score } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { SingleGameEventHandlers } from './EventHandlers'
import {
    SingleGameBoard,
    SingleGameBoardProps,
    SingleGameConfs,
} from './SingleGameBoard'
import { EOGDialog } from './uiparts/EOGDialog'
import { PlyInfo } from './uiparts/PlyInfo'

export type SingleGameProps = {
    cpState?: CheckerPlayState
    sgState: SGState
    sgConfs?: SingleGameConfs
    matchScore?: Score
    dialog?: JSX.Element
} & Partial<
        SingleGameEventHandlers &
        CheckerPlayListeners &
        RollListener
>

export function SingleGame(props: SingleGameProps) {
    const {
        cpState,
        sgState,
        sgConfs = {},
        matchScore = score(),
        dialog,
        onStartGame = () => {
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
                    onStartGame()
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
