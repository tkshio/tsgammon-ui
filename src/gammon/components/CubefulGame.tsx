import { Fragment } from 'react'
import { standardConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import {
    CBEoG,
    CBResponse,
    CBState
} from 'tsgammon-core/dispatchers/CubeGameState'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import { score as initScore, Score } from 'tsgammon-core/Score'
import { BoardEventHandlers } from './boards/Board'
import { CubefulGameBoard } from './CubefulGameBoard'
import { CubeGameEventHandlers } from "./CubeGameEventHandlers"
import { CBOperator } from './operators/CBOperator'
import { SingleGameConfs, SingleGameEventHandlers } from './SingleGameBoard'
import { CubeResponseDialog } from './uiparts/CubeResponseDialog'
import { EOGDialog } from './uiparts/EOGDialog'

export type CubefulGameConfs = {
    sgConfs: SingleGameConfs
    autoOperator?: CBOperator
    stakeConf?: StakeConf
}

export type CubefulGameProps = {
    cbState: CBState
    sgState: SGState
    cpState?: CheckerPlayState
    scoreBefore?: Score

    cbConfs?: CubefulGameConfs
    dialog?: JSX.Element
    onCloseEOGDialog?: () => void
} & Partial<
    CubeGameEventHandlers &
        SingleGameEventHandlers &
        RollListener &
        CheckerPlayListeners &
        BoardEventHandlers
>
export function CubefulGame(props: CubefulGameProps) {
    const {
        cbState,
        sgState,
        cpState,
        scoreBefore: score = initScore(),
        dialog,
        onCloseEOGDialog,
        cbConfs = { sgConfs: {} },
        ...eventHandlers
    } = props

    const { stakeConf = standardConf } = cbConfs
//    const dispatcher = cubeGameDispatcher(isCrawford, listeners)
  //  useAutoOperator(cbState, sgState, autoOperator, dispatcher)

/*    // チェッカープレイに関係ない時はSingleGame上で自律操作させない
    const sgAutoOperator: SGOperator | undefined =
        cbState.tag === 'CBAction' ||
        cbState.tag === 'CBResponse' ||
        cbState.tag === 'CBEoG'
            ? undefined
            : _cbConfs.sgConfs.autoOperator
    const cbConfs: CubefulGameConfs = {
        ..._cbConfs,
        sgConfs: { ..._cbConfs.sgConfs, autoOperator: sgAutoOperator },
    }
*/

    const cbDialog =
        dialog ??
        dialogForCubefulGame(cbState, {
            eogDialog: eogDialog(stakeConf, score, onCloseEOGDialog),
            cubeResponseDialog: cubeResponseDialog(eventHandlers),
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
    stakeConf: StakeConf,
    score: Score,
    onCloseEOGDialog?: () => void
): (cbState: CBEoG) => JSX.Element {
    return (cbState: CBEoG) => (
        <EOGDialog
            {...{
                ...cbState.calcStake(stakeConf),
                score: score,
                onClick: () => {
                    if (onCloseEOGDialog) {
                        onCloseEOGDialog()
                    }
                },
            }}
        />
    )
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
    dialogs: {
        eogDialog: (cbState: CBEoG) => JSX.Element
        cubeResponseDialog: (cbState: CBResponse) => JSX.Element
    }
): JSX.Element {
    return (
        <Fragment>
            {cbState && cbState.tag === 'CBEoG' && dialogs.eogDialog(cbState)}
            {cbState &&
                cbState.tag === 'CBResponse' &&
                dialogs.cubeResponseDialog(cbState)}
        </Fragment>
    )
}
