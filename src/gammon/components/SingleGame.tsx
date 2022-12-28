import { Fragment } from 'react'
import { GameConf, Score, score } from 'tsgammon-core'
import { ResignState } from 'tsgammon-core/states/ResignState'
import { defaultPlayersConf, PlayersConf } from './PlayersConf'
import { RSDialogHandler, RSToOffer } from './RSDialogHandler'
import { SingleGameBoard, SingleGameBoardProps } from './SingleGameBoard'
import { EOGDialog } from './uiparts/EOGDialog'
import { PlyInfo } from './uiparts/PlyInfo'
import { PositionID } from './uiparts/PositionID'
import { ResignButton } from './uiparts/ResignButton'
import { ResignDialog } from './uiparts/ResignDialog'

export type SingleGameProps = Omit<SingleGameBoardProps, 'cube'> & {
    resignState?: ResignState | RSToOffer
    matchScore?: Score
    gameConf?: GameConf
    playersConf?: PlayersConf
    showPositionID?: boolean
} & Partial<RSDialogHandler>

export function SingleGame(props: SingleGameProps) {
    const {
        resignState,
        cpState,
        sgState,
        matchScore = score(),
        gameConf,
        playersConf = defaultPlayersConf,
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
        resignDialog(resignState, playersConf, eventHandlers) ??
        (sgState.tag === 'SGEoG' ? (
            <EOGDialog
                stake={sgState.stake}
                eogStatus={sgState.eogStatus}
                score={matchScore}
                playersConf={playersConf}
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
        gameConf,
        playersConf,
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
    playersConf: PlayersConf,
    eventHandlers: Partial<RSDialogHandler>
) {
    const isGammonSaved = false
    return resignState === undefined ||
        resignState.tag === 'RSNone' ? undefined : (
        <ResignDialog
            {...{
                isGammonSaved,
                resignState,
                playersConf,
                ...eventHandlers,
            }}
        />
    )
}
