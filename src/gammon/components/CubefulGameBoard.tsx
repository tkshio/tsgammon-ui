import { Fragment, useCallback } from 'react'
import { BoardState, CubeState, standardConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { CubeGameListeners, cubeGameDispatcher } from 'tsgammon-core/dispatchers/CubeGameDispatcher'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListeners } from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { StakeConf } from 'tsgammon-core/dispatchers/StakeConf'
import { score as initScore, Score } from 'tsgammon-core/Score'

import {cubefulSGListener} from 'tsgammon-core/dispatchers/cubefulSGListener'

import { BoardEventHandlers } from './boards/Board'
import {
    SGOperator,
    SingleGameBoard,
    SingleGameBoardProps,
    SingleGameConfs,
} from './SingleGameBoard'
import { CubeResponseDialog } from './uiparts/CubeResponseDialog'
import { EOGDialog } from './uiparts/EOGDialog'
import { useDelayedTrigger } from './utils/useDelayedTrigger'

export type CubefulGameConfs = {
    sgConfs: SingleGameConfs
    autoOperator?: CBOperator
    stakeConf?: StakeConf
}

export type CBOperator = {
    operateRedCubeAction: (
        cubeState: CubeState,
        node: BoardState,
        doDouble: () => void,
        doSkipCubeAction: () => void
    ) => boolean
    operateRedCubeResponse: (
        cubeState: CubeState,
        node: BoardState,
        doTake: () => void,
        doPass: () => void
    ) => boolean
    operateWhiteCubeAction: (
        cubeState: CubeState,
        node: BoardState,
        doDouble: () => void,
        doSkipCubeAction: () => void
    ) => boolean
    operateWhiteCubeResponse: (
        cubeState: CubeState,
        node: BoardState,
        doTake: () => void,
        doPass: () => void
    ) => boolean
}

export type CubefulGameBoardProps = {
    cbState: CBState
    sgState: SGState
    cpState?: CheckerPlayState
    scoreBefore?: Score
    matchLength?: number
    isCrawford?: boolean

    cbConfs?: CubefulGameConfs

    cubeDialog?: JSX.Element
    eogDialog?: JSX.Element
    onCloseEOGDialog?: () => void
} & Partial<
    CubeGameListeners &
        SingleGameListeners &
        RollListener &
        CheckerPlayListeners &
        BoardEventHandlers
>

export function CubefulGameBoard(props: CubefulGameBoardProps) {
    const {
        cbState,
        sgState,
        scoreBefore: score = initScore(),
        isCrawford = false,
        eogDialog,
        cubeDialog,
        onCloseEOGDialog,
        cbConfs = { sgConfs: {} },
        ...listeners
    } = props
    const { autoRoll = false } = cbConfs.sgConfs
    const { autoOperator, stakeConf = standardConf } = cbConfs
    const skipCubeAction = isCrawford
    const dispatcher = cubeGameDispatcher(listeners)
    const doCubeActions = useCallback(() => {
        if (autoOperator) {
            if (cbState.tag === 'CBAction' && sgState.tag === 'SGToRoll') {
                const cubeAction =
                    autoOperator[
                        cbState.isRed
                            ? 'operateRedCubeAction'
                            : 'operateWhiteCubeAction'
                    ]
                return cubeAction(
                    // TODO: matchLength, score, isCrawfordを渡す
                    cbState.cubeState,
                    sgState.boardState,
                    () => {
                        dispatcher.doDouble(cbState)
                    },
                    () => {
                        dispatcher.doSkipCubeAction(cbState)
                    }
                )
            } else if (
                cbState.tag === 'CBResponse' &&
                sgState.tag === 'SGToRoll'
            ) {
                const cubeResponse =
                    autoOperator[
                        cbState.isRed
                            ? 'operateRedCubeResponse'
                            : 'operateWhiteCubeResponse'
                    ]
                return cubeResponse(
                    cbState.cubeState,
                    sgState.boardState.revert(),
                    () => {
                        dispatcher.doTake(cbState)
                    },
                    () => {
                        dispatcher.doPass(cbState)
                    }
                )
            }
        }
        return false
    }, [autoOperator, cbState, sgState, dispatcher])
    useDelayedTrigger(doCubeActions, 10)

    const doAutoRoll: boolean =
        // Takeの直後は自動的にロール
        cbState.tag === 'CBToRoll' && cbState.lastAction === 'Take'
            ? true
            : // Actionできる場合は自動ロールなし
            cbState.tag === 'CBAction'
            ? false
            : // それ以外は設定値次第
              autoRoll

    // チェッカープレイに関係ない時はSingleGame上で自律操作させない
    const sgAutoOperator: SGOperator | undefined =
        cbState.tag === 'CBAction' ||
        cbState.tag === 'CBResponse' ||
        cbState.tag === 'CBEoG'
            ? undefined
            : cbConfs.sgConfs.autoOperator

    const sgConfs: SingleGameConfs = {
        ...cbConfs.sgConfs,
        autoRoll: doAutoRoll,
        autoOperator: sgAutoOperator,
    }

    // キューブでのダブル
    const onClickCube = () => {
        if (cbState.tag === 'CBAction') {
            dispatcher.doDouble(cbState)
        }
    }

    const sgListeners: SingleGameListeners = cubefulSGListener(
        listeners,
        cbState,
        skipCubeAction,
        dispatcher
    )
    const dialog = (
        <Fragment>
            {!eogDialog && cbState && cbState.tag === 'CBEoG' && (
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
            )}
            {eogDialog}
            {!cubeDialog && cbState && cbState.tag === 'CBResponse' && (
                <CubeResponseDialog
                    {...{
                        onTake: () => {
                            dispatcher.doTake(cbState)
                        },
                        onPass: () => {
                            dispatcher.doPass(cbState)
                        },
                    }}
                />
            )}
            {cubeDialog}
        </Fragment>
    )
    const sgProps: SingleGameBoardProps = {
        ...props,
        ...sgListeners,
        cube: cbState.cubeState,
        onClickCube,
        sgConfs,
        dialog,
    }

    return <SingleGameBoard {...sgProps} />
}
