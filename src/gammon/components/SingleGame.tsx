import { Fragment } from 'react'
import { EOGStatus, Score, score } from 'tsgammon-core'
import { ResignButton } from './uiparts/ResignButton'
import { SingleGameBoard, SingleGameBoardProps } from './SingleGameBoard'
import { EOGDialog } from './uiparts/EOGDialog'
import { PlyInfo } from './uiparts/PlyInfo'
import { PositionID } from './uiparts/PositionID'
import { ResignEventHandlers } from './useResignState'
import { ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { ResignStateInChoose, ResignDialog } from './uiparts/ResignDialog'
import { SingleGameEventHandlers } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'

export type SingleGameProps = Omit<SingleGameBoardProps, 'cube'> & {
    resignState: ResignState | ResignStateInChoose
    matchScore?: Score
    showPositionID?: boolean
} & Partial<ResignEventHandlers>

export function SingleGame(props: SingleGameProps) {
    const {
        resignState,
        cpState,
        sgState,
        opConfs = {},
        matchScore = score(),
        showPositionID = true,
        dialog,
        lowerButton,
        upperButton,
        onStartGame,
        ...eventHandlers
    } = props

    const sgDialog =
        dialog ??
        resignDialog(resignState, sgState, eventHandlers) ??
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

    const { onResign } = eventHandlers
    const resignButton =
        lowerButton ?? //
        onResign ? (
            <ResignButton onClick={onResign} />
        ) : undefined

    const singleGameProps: SingleGameBoardProps = {
        sgState,
        cpState,
        opConfs: opConfs,
        dialog: sgDialog,
        lowerButton: resignButton,
        ...eventHandlers,
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
function resignDialog(
    resignState: ResignState | ResignStateInChoose,
    sgState: SGState,
    eventHandlers: Partial<
        ResignEventHandlers & Pick<SingleGameEventHandlers, 'onEndGame'>
    >
) {
    return resignState.tag === 'RSNone' ? undefined : (
        <ResignDialog
            {...{
                resignState,
                onAcceptResign: (result: SGResult, eogStatus: EOGStatus) =>
                    eventHandlers.onEndGame?.(sgState, result, eogStatus),
                ...eventHandlers,
            }}
        />
    )
}
