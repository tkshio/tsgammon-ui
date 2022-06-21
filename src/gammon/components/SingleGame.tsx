import { Fragment } from 'react'
import { EOGStatus, Score, score } from 'tsgammon-core'
import { ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { SingleGameEventHandlers } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { SingleGameBoard, SingleGameBoardProps } from './SingleGameBoard'
import { EOGDialog } from './uiparts/EOGDialog'
import { PlyInfo } from './uiparts/PlyInfo'
import { PositionID } from './uiparts/PositionID'
import { ResignButton } from './uiparts/ResignButton'
import { ResignDialog, RSToOffer } from './uiparts/ResignDialog'
import { ResignEventHandlers } from './useResignState'

export type SingleGameProps = Omit<SingleGameBoardProps, 'cube'> & {
    resignState: ResignState | RSToOffer
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
        onResign,
        ...eventHandlers
    } = props

    const sgDialog =
        dialog ??
        resignDialog(sgState, resignState, eventHandlers) ??
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

        const resignButton =
        lowerButton ?? //
        resignState.tag === 'RSNone' ? (
            sgState.tag !== 'SGOpening' && sgState.tag !== 'SGEoG' ? (
                <ResignButton onClick={() => onResign?.(sgState.isRed)} />
            ) : undefined
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
    sgState: SGState,
    resignState: ResignState | RSToOffer,
    eventHandlers: Partial<
        ResignEventHandlers & Pick<SingleGameEventHandlers, 'onEndGame'>
    >
) {
    const isGammonSaved = false
    return resignState.tag === 'RSNone' ? undefined : (
        <ResignDialog
            {...{
                isGammonSaved,
                resignState,
                acceptResign: (result: SGResult, eogStatus: EOGStatus) =>
                    eventHandlers.onEndGame?.(sgState, result, eogStatus),
                ...eventHandlers,
            }}
        />
    )
}
