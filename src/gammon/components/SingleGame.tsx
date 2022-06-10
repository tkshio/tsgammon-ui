import { Fragment } from 'react'
import { Score, score } from 'tsgammon-core'
import { ResignButton } from './uiparts/ResignButton'
import { SingleGameBoard, SingleGameBoardProps } from './SingleGameBoard'
import { EOGDialog } from './uiparts/EOGDialog'
import { PlyInfo } from './uiparts/PlyInfo'

export type SingleGameProps = Omit<SingleGameBoardProps, 'cube'> & {
    matchScore?: Score
    onResign?: () => void
}

export function SingleGame(props: SingleGameProps) {
    const {
        cpState,
        sgState,
        sgConfs = {},
        matchScore = score(),
        dialog,
        onStartGame,
        onResign,
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

    const lowerButton = onResign ? (
        <ResignButton {...{ onResign }} />
    ) : undefined
    const singleGameProps: SingleGameBoardProps = {
        sgState,
        cpState,
        sgConfs,
        dialog: eogDialog,
        lowerButton,
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
