import { Fragment } from 'react'
import { standardConf } from 'tsgammon-core'
import { BGEventHandlers } from 'tsgammon-core/dispatchers/BGEventHandlers'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { CBResponse } from 'tsgammon-core/dispatchers/CubeGameState'
import { MatchState, MatchStateEoG } from 'tsgammon-core/dispatchers/MatchState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { score } from 'tsgammon-core/Score'
import { CubefulGameBoard, CubefulGameBoardProps } from './CubefulGameBoard'
import { CBOperator } from './operators/CBOperator'
import { SGOperator } from './operators/SGOperator'
import { SingleGameConfs } from './SingleGameBoard'
import { CubeResponseDialog } from './uiparts/CubeResponseDialog'
import { EOGDialog } from './uiparts/EOGDialog'
import { ResignButton } from './uiparts/ResignButton'
import { useCBAutoOperator } from './useCBAutoOperator'
import { eogMatchState } from './useMatchState'

export type CubefulGameConfs = {
    sgConfs: SingleGameConfs
}

export type CubefulGameProps = Omit<CubefulGameBoardProps, 'lowerButton'> & {
    matchState: MatchState
    autoOperators?: { sg?: SGOperator; cb?: CBOperator }
    onResign?:()=>void
} & Partial<Pick<BGEventHandlers, 'onTake' | 'onPass'>>

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
        bgState,
        cpState,
        matchState = props.bgState.cbState.tag === 'CBEoG'
            ? eogMatchState(defaultMatchState, props.bgState.cbState)
            : defaultMatchState,
        cbConfs = { sgConfs: {} },
        dialog,
        upperButton,
        autoOperators = { sg: undefined, cb: undefined },
        onResign,
        ...eventHandlers
    } = props
    const { cbState, sgState } = bgState
    useCBAutoOperator(cbState, sgState, autoOperators, eventHandlers)

    const cbDialog =
        dialog ??
        dialogForCubefulGame(bgState, matchState, {
            eogDialog: eogDialog(eventHandlers.onStartGame),
            cubeResponseDialog: cubeResponseDialog(eventHandlers),
        })

    const lowerButton = onResign ? (
        <ResignButton {...{ onResign }} />
    ) : undefined
    const cbProps = {
        bgState,
        cpState,
        cbConfs,
        dialog: cbDialog,
        upperButton,
        lowerButton,
        ...eventHandlers,
    }
    return <CubefulGameBoard {...cbProps} />
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
