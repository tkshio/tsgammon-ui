import { Fragment, useCallback } from "react"
import { score as initScore, Score } from "tsgammon-core/Score"
import { doNothingOperator } from "../dispatchers/autoOperators"
import { CheckerPlayListeners } from "../dispatchers/CheckerPlayDispatcher"
import { CheckerPlayState } from "../dispatchers/CheckerPlayState"
import { cubefulSGListener } from "../dispatchers/cubefulSGListener"
import { CubeGameDispatcher, cubeGameDispatcher, CubeGameListeners } from "../dispatchers/CubeGameDispatcher"
import { CBAction, CBResponse, CBState } from "../dispatchers/CubeGameState"
import { RollListener } from "../dispatchers/RollDispatcher"
import { SingleGameListeners } from "../dispatchers/SingleGameDispatcher"
import { SGState, SGToRoll } from "../dispatchers/SingleGameState"
import { BoardEventHandlers } from "./boards/Board"
import { SGOperator, SingleGameBoard, SingleGameBoardProps, SingleGameConfs } from "./SingleGameBoard"
import { CubeResponseDialog } from "./uiparts/CubeResponseDialog"
import { EOGDialog } from "./uiparts/EOGDialog"
import { useDelayedTrigger } from "./utils/useDelayedTrigger"



export type CubefulGameConfs = {
    sgConfs: SingleGameConfs
    autoOperator?: CBOperator
}

export type CBOperator = {
    operateCubeAction: (dispatcher: CubeGameDispatcher, cbState: CBAction, sgState: SGToRoll) => boolean
    operateCubeResponse: (dispatcher: CubeGameDispatcher, cbState: CBResponse, sgState: SGToRoll) => boolean
}

export type CubefulGameBoardProps = {
    cbState: CBState
    sgState: SGState
    cpState?: CheckerPlayState
    scoreBefore?: Score

    cbConfs?: CubefulGameConfs

    cubeDialog?: JSX.Element
    eogDialog?: JSX.Element
    onCloseEOGDialog?: () => void
}
    & Partial<
        CubeGameListeners
        & SingleGameListeners
        & RollListener
        & CheckerPlayListeners
        & BoardEventHandlers
    >

export function CubefulGameBoard(props: CubefulGameBoardProps) {
    const {
        cbState, sgState, cpState,
        scoreBefore: score = initScore(),

        eogDialog,
        cubeDialog,
        onCloseEOGDialog,
        cbConfs = { sgConfs: {} },
        ...listeners
    } = props
    const { autoRoll = false } = cbConfs.sgConfs
    const { autoOperator } = cbConfs
    const dispatcher = cubeGameDispatcher(listeners)
    const doCubeActions = useCallback(() => {
        if (autoOperator) {
            if (cbState.tag === "CBAction" && sgState.tag === "SGToRoll") {
                return autoOperator.operateCubeAction(dispatcher, cbState, sgState)
            } else if (cbState.tag === "CBResponse" && sgState.tag === "SGToRoll") {
                return autoOperator.operateCubeResponse(dispatcher, cbState, sgState)
            }
        }
        return false
    }, [autoOperator, cbState, sgState, dispatcher])
    useDelayedTrigger(doCubeActions, 10)

    const doAutoRoll: boolean =
        // Takeの直後は自動的にロール
        (cbState.tag === "CBToRoll" && cbState.lastAction === "Take") ? true
            // Actionできる場合は自動ロールなし
            : (cbState.tag === "CBAction") ? false
                // それ以外は設定値次第
                : autoRoll

    // チェッカープレイに関係ない時はSingleGame上で自律操作させない
    const sgAutoOperator: SGOperator | undefined =
        (cbState.tag === "CBAction" || cbState.tag === "CBResponse" || cbState.tag === "CBEoG") ?
            doNothingOperator
            : cbConfs.sgConfs.autoOperator

    const sgConfs: SingleGameConfs = { ...cbConfs.sgConfs, autoRoll: doAutoRoll, autoOperator: sgAutoOperator }

    // キューブでのダブル
    const onClickCube = () => {
        if (cbState.tag === "CBAction") {
            dispatcher.doDouble(cbState)
        }
    }

    const sgListeners: SingleGameListeners = cubefulSGListener(listeners, cbState, dispatcher)
    const sgProps: SingleGameBoardProps = {
        ...props,
        ...sgListeners,
        cube: cbState.cubeState,
        onClickCube,
        sgConfs
    }

    return (
        <Fragment>
            <SingleGameBoard {...sgProps} />
            {(!eogDialog && cbState && cbState.tag === "CBEoG") &&
                <EOGDialog {...{
                    ...cbState, score: score, onClick: () => {
                        if (onCloseEOGDialog) {
                            onCloseEOGDialog()
                        }
                    }
                }} />}
            {eogDialog}
            {(!cubeDialog && cbState && cbState.tag === "CBResponse") &&
                <CubeResponseDialog {...{
                    onTake: () => {
                        dispatcher.doTake(cbState)
                    },
                    onPass: () => {
                        dispatcher.doPass(cbState)
                    }
                }} />
            }
            {cubeDialog}
        </Fragment>
    )
}
