import { Fragment } from 'react'
import { standardConf } from 'tsgammon-core'
import { BGEventHandler } from 'tsgammon-core/dispatchers/BGEventHandler'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { CBResponse } from 'tsgammon-core/dispatchers/CubeGameState'
import { ResignState, RSNONE } from 'tsgammon-core/dispatchers/ResignState'
import { SGToRoll } from 'tsgammon-core/dispatchers/SingleGameState'
import { toGameState } from 'tsgammon-core/dispatchers/utils/toGameState'
import { MatchState, MatchStateEoG } from 'tsgammon-core/MatchState'
import { score } from 'tsgammon-core/Score'
import { CubefulGameBoard, CubefulGameBoardProps } from './CubefulGameBoard'
import { RSDialogHandler, RSToOffer } from './RSDialogHandler'
import { resignDialog } from './SingleGame'
import { CubeResponseDialog } from './uiparts/CubeResponseDialog'
import { EOGDialog } from './uiparts/EOGDialog'
import { MatchID } from './uiparts/MatchID'
import { PositionID } from './uiparts/PositionID'
import { ResignButton } from './uiparts/ResignButton'
import { eogMatchState } from './useMatchState'

export type CubefulGameProps = CubefulGameBoardProps & {
    resignState?: ResignState | RSToOffer
    matchState: MatchState
    showPositionIDs?: boolean
} & Partial<Pick<BGEventHandler, 'onTake' | 'onPass'>> &
    Partial<RSDialogHandler>

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
        resignState = RSNONE,
        bgState,
        cpState,
        matchState = props.bgState.cbState.tag === 'CBEoG'
            ? eogMatchState(defaultMatchState, props.bgState.cbState)
            : defaultMatchState,
        dialog,
        upperButton,
        lowerButton,
        showPositionIDs = true,
        onResign,
        ...eventHandlers
    } = props
    const { sgState } = bgState

    const resignButton =
        // 指定されたボタンがあれば、resignButtonは表示しない
        lowerButton ?? //
        // 降参可能な時（まだ降参のオファーを始めておらず、どちらかの手番の時）
        resignState.tag === 'RSNone' ? (
            sgState.tag !== 'SGOpening' && sgState.tag !== 'SGEoG' ? (
                <ResignButton onClick={() => onResign?.(sgState.isRed)} />
            ) : undefined
        ) : undefined

    const cbDialog =
        dialog ??
        resignDialog(resignState, eventHandlers) ??
        dialogForCubefulGame(bgState, matchState, {
            eogDialog: eogDialog(eventHandlers.onStartGame),
            cubeResponseDialog: cubeResponseDialog(eventHandlers),
        })

    const cbProps: CubefulGameBoardProps = {
        bgState,
        cpState,
        dialog: cbDialog,
        upperButton,
        lowerButton: resignButton,
        ...eventHandlers,
    }
    const gameState = toGameState(
        bgState,
        resignState === undefined || resignState.tag === 'RSToOffer'
            ? RSNONE
            : resignState
    )
    return (
        <Fragment>
            {showPositionIDs && (
                <Fragment>
                    <MatchID matchState={matchState} gameState={gameState} />
                    <PositionID points={sgState.boardState.points} />
                </Fragment>
            )}
            <CubefulGameBoard {...cbProps} />
        </Fragment>
    )
}

function dialogForCubefulGame(
    bgState: BGState,
    matchState: MatchState,
    dialogs: {
        eogDialog: (matchState: MatchStateEoG) => JSX.Element
        cubeResponseDialog: (bgState: {
            cbState: CBResponse
            sgState: SGToRoll
        }) => JSX.Element
    }
): JSX.Element {
    const { cbState, sgState } = bgState
    const isResponse =
        cbState.tag === 'CBResponse' && sgState.tag === 'SGToRoll'
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
    eventHandlers: Partial<BGEventHandler>
): (bgState: { cbState: CBResponse; sgState: SGToRoll }) => JSX.Element {
    return (bgState: { cbState: CBResponse; sgState: SGToRoll }) => (
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
