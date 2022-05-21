import { Fragment } from 'react'
import { standardConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { CBResponse, CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import { score } from 'tsgammon-core/Score'
import { BoardEventHandlers } from './boards/Board'
import { CubefulGameBoard } from './CubefulGameBoard'
import { SingleGameEventHandlers } from './SingleGameEventHandlers'
import { CubeGameEventHandlers } from "./CubeGameEventHandlers"
import { MatchState, matchStateEOG, MatchStateEOG } from './MatchState'
import { CBOperator } from './operators/CBOperator'
import { SingleGameConfs } from './SingleGameBoard'
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
    matchState: MatchState
    cbConfs?: CubefulGameConfs
    dialog?: JSX.Element
} & Partial<
    CubeGameEventHandlers &
        SingleGameEventHandlers &
        RollListener &
        CheckerPlayListeners &
        BoardEventHandlers
>
export function CubefulGame(props: CubefulGameProps) {
    const defaultMatchState: MatchState = {
        isEoG: false,
        stakeConf: standardConf,
        scoreBefore: score(),
        matchLength: 0,
        isCrawford: false,
    }
    const {
        cbState,
        sgState,
        cpState,
        matchState = props.cbState.tag === 'CBEoG'
            ? matchStateEOG(defaultMatchState, props.cbState)
            : defaultMatchState,
        dialog,
        cbConfs = { sgConfs: {} },
        onStartCubeGame = () => {
            //
        },
        ...eventHandlers
    } = props
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
        dialogForCubefulGame(cbState, matchState, {
            eogDialog: eogDialog(onStartCubeGame),
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
