import { EOGStatus } from 'tsgammon-core'
import { SingleGameListener } from 'tsgammon-core/dispatchers/SingleGameListener'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { operateWithSGandRS } from '../operateWithRS'
import { RSOperator } from '../operators/RSOperator'
import { SGOperator } from '../operators/SGOperator'
import { defaultPlayersConf } from '../PlayersConf'
import { RecordedSingleGame } from '../recordedGames/RecordedSingleGame'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { useResignState } from '../useResignState'
import { BGCommonProps } from './BGCommonProps'
import { useCubeless } from './useCubeless'

export type CubelessProps = {
    autoOperators?: { sg?: SGOperator; rs?: RSOperator }
} & BGCommonProps &
    Partial<SingleGameListener>

/**
 * 回数無制限の対戦を行うコンポーネント
 * @param props ゲーム設定
 * @param props.boardOperator 人間側の操作を担当するBoardOperator
 * @param props.autoOperator CPU側の操作を担当するAutoOperator
 * @param props.initialScore スコアの初期値
 * @constructor
 */
export function Cubeless(props: CubelessProps) {
    const {
        gameConf,
        playersConf = defaultPlayersConf,
        gameSetup,
        autoOperators = { sg: undefined },
        diceSource,
        onRollRequest,
        dialog,
        recordMatch = false,
        matchScore,
        ...exListeners
    } = props

    const { sgState, cpState, cpListener, handler, sgRecorder, eogHandler } =
        useCubeless({
            gameSetup,
            gameConf,
            diceSource,
            onRollRequest,
            recordMatch,
            matchScore,
        })

    const { resignState, rsDialogHandler: rsHandler } = useResignState(
        (result: SGResult, eog: EOGStatus) =>
            eogHandler.onEndOfGame(sgState, result, eog)
    )

    const { sgHandler: handlersWithOp, rsDialogHandler } = operateWithSGandRS(
        autoOperators,
        sgState,
        rsHandler,
        handler
    )

    const singleGameProps: SingleGameProps = {
        ...exListeners,
        resignState,
        sgState,
        cpState,
        dialog,
        gameConf,
        playersConf,
        ...rsDialogHandler,
        ...handlersWithOp,
        ...cpListener,
    }

    if (sgRecorder.recordMatch) {
        return <RecordedSingleGame {...{ ...singleGameProps, ...sgRecorder }} />
    } else {
        return (
            <div id="main">
                <div id="boardPane">
                    <SingleGame
                        {...{
                            ...singleGameProps,
                            matchScore: sgRecorder.matchRecord.matchState.score,
                        }}
                    />
                </div>
            </div>
        )
    }
}

export type SGRecorder = {
    recordMatch: boolean
    onResumeState: (index: number) => void
    matchRecord: MatchRecord<SGState>
}
