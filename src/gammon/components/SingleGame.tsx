import { Fragment } from 'react'
import { Score, score } from 'tsgammon-core'
import { ResignButton } from './uiparts/ResignButton'
import { SingleGameBoard, SingleGameBoardProps } from './SingleGameBoard'
import { EOGDialog } from './uiparts/EOGDialog'
import { PlyInfo } from './uiparts/PlyInfo'
import { PositionID } from './uiparts/PositionID'

export type SingleGameProps = Omit<SingleGameBoardProps, 'cube'> & {
    matchScore?: Score
    showPositionID?: boolean
    onResign?: () => void
}

export function SingleGame(props: SingleGameProps) {
    const {
        cpState,
        sgState,
        opConfs = {},
        matchScore = score(),
        showPositionID = true,
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
        opConfs: opConfs,
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
            {showPositionID && (
                <PositionID points={sgState.boardState.points} />
            )}
            <SingleGameBoard {...singleGameProps} />
            <PlyInfo {...plyInfoProps} />
        </Fragment>
    )
}
