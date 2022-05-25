import { Fragment } from 'react'
import { standardConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { CBResponse, CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import { score } from 'tsgammon-core/Score'
import { BoardEventHandlers } from './boards/Board'
import { CubefulGameBoard } from './CubefulGameBoard'
import { CubeGameEventHandlers } from './eventHandlers/CubeGameEventHandlers'
import { MatchState, matchStateEOG, MatchStateEOG } from './MatchState'
import { CBOperator } from './operators/CBOperator'
import { SingleGameConfs } from './SingleGameBoard'
import { CubeResponseDialog } from './uiparts/CubeResponseDialog'
import { EOGDialog } from './uiparts/EOGDialog'
import { useCBAutoOperator } from './useCBAutoOperator'
import { SGOperator } from './operators/SGOperator'
import {
    BGEventHandlers,
    asCBEventHandlers,
} from './eventHandlers/BGEventHandlers'
import { BGState } from './BGState'

export type CubefulGameConfs = {
    sgConfs: SingleGameConfs
    autoOperator?: CBOperator
    stakeConf?: StakeConf
}

export type CubefulGameProps = {
    bgState:BGState
    cpState?: CheckerPlayState
    matchState: MatchState
    cbConfs?: CubefulGameConfs
    autoOperators?: { sg?: SGOperator; cb?: CBOperator }
    dialog?: JSX.Element
} & Partial<BGEventHandlers & CheckerPlayListeners & BoardEventHandlers>
export function CubefulGame(props: CubefulGameProps) {
    const defaultMatchState: MatchState = {
        isEoG: false,
        stakeConf: standardConf,
        scoreBefore: score(),
        matchLength: 0,
        isCrawford: false,
    }
    const {
        bgState,
        cpState,
        matchState = props.bgState.cbState.tag === 'CBEoG'
            ? matchStateEOG(defaultMatchState, props.bgState.cbState)
            : defaultMatchState,
        dialog,
        cbConfs = { sgConfs: {} },
        autoOperators = { sg: undefined, cb: undefined },
        ...eventHandlers
    } = props
    const {cbState, sgState } = bgState
    useCBAutoOperator(cbState, sgState, autoOperators, eventHandlers)

    const cbDialog =
        dialog ??
        dialogForCubefulGame(cbState, matchState, {
            eogDialog: eogDialog(
                eventHandlers.onStartGame ??
                    (() => {
                        //
                    })
            ),
            cubeResponseDialog: cubeResponseDialog(
                asCBEventHandlers(sgState, eventHandlers)
            ),
        })

    const cbProps = {
        cbState,
        sgState,
        cpState,
        cbConfs,
        dialog: cbDialog,
        ...eventHandlers,
    }
    return <CubefulGameBoard {...cbProps} />
}

function eogDialog(
    onStartCubeGame: () => void
): (matchState: MatchStateEOG) => JSX.Element {
    return (matchState: MatchStateEOG) => {
        return (
            <EOGDialog
                {...{
                    ...matchState,
                    score: matchState.scoreAfter,
                    onClick: () => {
                        onStartCubeGame()
                    },
                }}
            />
        )
    }
}
function cubeResponseDialog(
    eventHandlers: Partial<CubeGameEventHandlers>
): (cbState: CBResponse) => JSX.Element {
    return (cbState: CBResponse) => (
        <CubeResponseDialog
            {...{
                onTake: () => {
                    if (eventHandlers.onTake) {
                        eventHandlers.onTake(cbState)
                    }
                },
                onPass: () => {
                    if (eventHandlers.onPass) {
                        eventHandlers.onPass(cbState)
                    }
                },
            }}
        />
    )
}
function dialogForCubefulGame(
    cbState: CBState,
    matchState: MatchState,
    dialogs: {
        eogDialog: (matchState: MatchStateEOG) => JSX.Element
        cubeResponseDialog: (cbState: CBResponse) => JSX.Element
    }
): JSX.Element {
    const isEoG = matchState && matchState.isEoG
    const isResponse = !isEoG && cbState.tag === 'CBResponse'
    return (
        <Fragment>
            {isEoG && dialogs.eogDialog(matchState)}
            {isResponse && dialogs.cubeResponseDialog(cbState)}
        </Fragment>
    )
}
