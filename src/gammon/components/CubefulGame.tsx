import { Fragment } from 'react'
import { EOGStatus, standardConf } from 'tsgammon-core'
import { BGEventHandlers } from 'tsgammon-core/dispatchers/BGEventHandlers'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { CBResponse } from 'tsgammon-core/dispatchers/CubeGameState'
import { MatchState, MatchStateEoG } from 'tsgammon-core/dispatchers/MatchState'
import { ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { score } from 'tsgammon-core/Score'
import { CubefulGameBoard, CubefulGameBoardProps } from './CubefulGameBoard'
import { CubeResponseDialog } from './uiparts/CubeResponseDialog'
import { EOGDialog } from './uiparts/EOGDialog'
import { PositionID } from './uiparts/PositionID'
import { ResignButton } from './uiparts/ResignButton'
import { ResignDialog, RSToOffer } from './uiparts/ResignDialog'
import { eogMatchState } from './useMatchState'
import { ResignEventHandlers } from './useResignState'

export type CubefulGameProps = CubefulGameBoardProps & {
    resignState?: ResignState | RSToOffer
    matchState: MatchState
    showPositionID?: boolean
} & Partial<Pick<BGEventHandlers, 'onTake' | 'onPass'>> &
    Partial<ResignEventHandlers>

export function CubefulGame(props: CubefulGameProps) {
    const defaultMatchState: MatchState = {
        isEoG: false,
        stakeConf: standardConf,
        scoreBefore: score(),
        score: score(),
        matchLength: 0,
        isCrawford: false,
    }
    const {
        resignState,
        bgState,
        cpState,
        matchState = props.bgState.cbState.tag === 'CBEoG'
            ? eogMatchState(defaultMatchState, props.bgState.cbState)
            : defaultMatchState,
        opConfs,
        dialog,
        upperButton,
        lowerButton,
        showPositionID = true,
        onResign,
        ...eventHandlers
    } = props
    const { sgState } = bgState

    const resignButton =
        lowerButton ?? //
        resignState?.tag === 'RSNone' ? (
            sgState.tag !== 'SGOpening' && sgState.tag !== 'SGEoG' ? (
                <ResignButton onClick={() => onResign?.(sgState.isRed)} />
            ) : undefined
        ) : undefined

    const cbDialog =
        dialog ??
        resignDialog(bgState, resignState, eventHandlers) ??
        dialogForCubefulGame(bgState, matchState, {
            eogDialog: eogDialog(eventHandlers.onStartGame),
            cubeResponseDialog: cubeResponseDialog(eventHandlers),
        })

    const cbProps: CubefulGameBoardProps = {
        bgState,
        cpState,
        opConfs,
        dialog: cbDialog,
        upperButton,
        lowerButton: resignButton,
        ...eventHandlers,
    }
    return (
        <Fragment>
            {showPositionID && (
                <PositionID points={sgState.boardState.points} />
            )}
            <CubefulGameBoard {...cbProps} />
        </Fragment>
    )
}

function resignDialog(
    bgState: BGState,
    resignState: ResignState | RSToOffer | undefined,
    eventHandlers: Partial<
        ResignEventHandlers & Pick<BGEventHandlers, 'onEndGame'>
    >
) {
    const isGammonSaved = false
    return resignState === undefined ||
        resignState.tag === 'RSNone' ? undefined : (
        <ResignDialog
            {...{
                isGammonSaved,
                resignState,
                acceptResign: (result: SGResult, eogStatus: EOGStatus) =>
                    eventHandlers.onEndGame?.(bgState, result, eogStatus),
                ...eventHandlers,
            }}
        />
    )
}

function dialogForCubefulGame(
    bgState: BGState,
    matchState: MatchState,
    dialogs: {
        eogDialog: (matchState: MatchStateEoG) => JSX.Element
        cubeResponseDialog: (bgState: {
            cbState: CBResponse
            sgState: SGState
        }) => JSX.Element
    }
): JSX.Element {
    const { cbState, sgState } = bgState
    const isResponse = cbState.tag === 'CBResponse'
    const isEoG = cbState.tag === 'CBEoG' && matchState.isEoG
    return (
        <Fragment>
            {isResponse && dialogs.cubeResponseDialog({ cbState, sgState })}
            {isEoG && dialogs.eogDialog(matchState)}
        </Fragment>
    )
}

function eogDialog(
    onStartCubeGame?: () => void
): (matchState: MatchStateEoG) => JSX.Element {
    return (matchState: MatchStateEoG) => {
        return (
            <EOGDialog
                {...{
                    ...matchState,
                    score: matchState.scoreAfter,
                    onClick: () => {
                        onStartCubeGame?.()
                    },
                }}
            />
        )
    }
}
function cubeResponseDialog(
    eventHandlers: Partial<BGEventHandlers>
): (bgState: { cbState: CBResponse; sgState: SGState }) => JSX.Element {
    return (bgState: { cbState: CBResponse; sgState: SGState }) => (
        <CubeResponseDialog
            {...{
                onTake: () => {
                    eventHandlers.onTake?.(bgState)
                },
                onPass: () => {
                    eventHandlers.onPass?.(bgState)
                },
            }}
        />
    )
}
