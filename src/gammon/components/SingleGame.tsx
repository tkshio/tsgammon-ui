import { Fragment } from 'react'
import { Score, score } from 'tsgammon-core'
import { ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { SingleGameBoard, SingleGameBoardProps } from './SingleGameBoard'
import { EOGDialog } from './uiparts/EOGDialog'
import { PlyInfo } from './uiparts/PlyInfo'
import { PositionID } from './uiparts/PositionID'
import { ResignButton } from './uiparts/ResignButton'
import { ResignDialog } from './uiparts/ResignDialog'
import { RSDialogHandler, RSToOffer } from "./RSDialogHandler"

export type SingleGameProps = Omit<SingleGameBoardProps, 'cube'> & {
    resignState?: ResignState | RSToOffer
    matchScore?: Score
    showPositionID?: boolean
} & Partial<RSDialogHandler>

export function SingleGame(props: SingleGameProps) {
    const {
        resignState,
        cpState,
        sgState,
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
        resignDialog(resignState, eventHandlers) ??
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
        resignState?.tag === 'RSNone' ? (
            sgState.tag !== 'SGOpening' && sgState.tag !== 'SGEoG' ? (
                <ResignButton onClick={() => onResign?.(sgState.isRed)} />
            ) : undefined
        ) : undefined

    const singleGameProps: SingleGameBoardProps = {
        sgState,
        cpState,
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

export function resignDialog(
    resignState: ResignState | RSToOffer | undefined,
    eventHandlers: Partial<RSDialogHandler>
) {
    const isGammonSaved = false
    return resignState === undefined ||
        resignState.tag === 'RSNone' ? undefined : (
        <ResignDialog
            {...{
                isGammonSaved,
                resignState,
                ...eventHandlers,
            }}
        />
    )
}
