import { EOGStatus } from 'tsgammon-core'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { CubefulGame } from '../CubefulGame'
import { BGListener } from '../dispatchers/BGListener'
import { operateWithBGandRS } from '../operateWithRS'
import { CBOperator } from '../operators/CBOperator'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { defaultPlayersConf } from '../PlayersConf'
import { RecordedCubefulGame } from '../recordedGames/RecordedCubefulGame'
import { useResignState } from '../useResignState'
import { BGCommonProps } from './BGCommonProps'
import { useCubeful } from './useCubeful'

export type CubefulMatchProps = BGCommonProps & {
    autoOperators?: { cb?: CBOperator; sg?: SGOperator; rs?: RSOperator }
    onEndOfMatch?: () => void
} & Partial<BGListener>

/**
 * 回数無制限の対戦を行うコンポーネント
 * @param props ゲーム設定
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.autoOperator CPU側の操作を担当するAutoOperator
 * @param props.initialScore スコアの初期値
 * @constructor
 */
export function CubefulMatch(props: CubefulMatchProps) {
    const {
        autoOperators = { cb: undefined, sg: undefined, rs: undefined },
        gameConf,
        playersConf = defaultPlayersConf,
        gameSetup,
        diceSource,
        onRollRequest,
        onEndOfMatch = () => {
            //
        },
        dialog,
        matchLength,
        ...exListeners
    } = props

    const {
        bgState,
        bgEventHandler,
        cpState,
        cpListener,
        eogHandler,
        matchState,
        bgRecorder,
    } = useCubeful(props)

    // 降参機能
    const { resignState, rsDialogHandler } = useResignState(
        (result: SGResult, eog: EOGStatus) =>
            eogHandler.onEndOfBGGame(bgState, result, eog)
    )

    // ゲーム進行の自動処理
    const {
        bgEventHandler: bgEventHandlerWithOp,
        rsDialogHandler: rsDialogHandlerWithOp,
    } = operateWithBGandRS(
        resignState,
        bgState,
        autoOperators,
        bgEventHandler,
        rsDialogHandler
    )

    const cbProps = {
        ...exListeners,
        resignState,
        bgState,
        cpState,
        ...cpListener,
        ...bgEventHandlerWithOp,
        ...rsDialogHandlerWithOp,
        dialog,
        onEndOfMatch,
        gameConf,
        playersConf,
    }

    if (bgRecorder.recordMatch) {
        return (
            <RecordedCubefulGame
                {...{
                    ...cbProps,
                    matchRecord: bgRecorder.matchRecord,
                    onResumeState: bgRecorder.onResumeState,
                }}
            />
        )
    } else {
        return (
            <div id="main">
                <div id="boardPane">
                    <CubefulGame {...{ ...cbProps, matchState }} />
                </div>
            </div>
        )
    }
}
