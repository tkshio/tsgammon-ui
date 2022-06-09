import { Fragment } from 'react'
import { Score, score } from 'tsgammon-core'
import {
    SingleGameBoard,
    SingleGameBoardProps
} from './SingleGameBoard'
import { EOGDialog } from './uiparts/EOGDialog'
import { PlyInfo } from './uiparts/PlyInfo'


export type SingleGameProps = Omit<SingleGameBoardProps, 'cube'> & {
    matchScore?: Score
}

export function SingleGame(props: SingleGameProps) {
    const {
        cpState,
        sgState,
        sgConfs = {},
        matchScore = score(),
        dialog,
        onStartGame,
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
                    onStartGame?.()
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
