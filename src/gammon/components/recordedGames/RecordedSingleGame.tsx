import { Fragment } from 'react'
import { GameConf, standardConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    decorate,
    SingleGameListeners
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGEoG, SGState, SGToRoll } from 'tsgammon-core/dispatchers/SingleGameState'
import {
    plyRecordForCheckerPlay,
    plyRecordForEoG
} from 'tsgammon-core/records/PlyRecord'
import {
    SingleGameBoard,
    SingleGameBoardProps,
    SingleGameConfs
} from '../SingleGameBoard'
import { EOGDialog } from '../uiparts/EOGDialog'
import { PlyInfo } from '../uiparts/PlyInfo'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { RecordedGame } from './RecordedGame'
import { MatchRecorder, useMatchRecorder } from './useMatchRecorder'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedSingleGameProps = {
    gameConf:GameConf
    sgState: SGState
    sgConfs: SingleGameConfs
    onStartNextGame: () => void
    onResumeState: (index:number, state: SGState) => void
} & SingleGameListeners &
    Partial<CheckerPlayListeners & RollListener>

export function RecordedSingleGame(props: RecordedSingleGameProps) {
    const {
        gameConf = standardConf,
        sgState: curSGState,
        sgConfs = {},
        onResumeState = () => {
            //
        },
        onStartNextGame = () => {
            //
        },
        ...listeners
    } = props

    const [cpState, cpListeners, setCPState] = useCheckerPlayListeners(
        undefined,
        listeners
    )
    const [matchRecord, matchRecorder] = useMatchRecorder<SGState>(gameConf)
    const {
        selectedState: { index, state: sgState },
        ssListeners,
    } = useSelectableStateWithRecord(
        curSGState,
        setCPState,
        onResumeState
    )

    const isLatest = index === undefined

    const sgListeners: SingleGameListeners = decorate(
        listeners,
        asListeners(matchRecorder)
    )

    const eogDialog =
        sgState.tag === 'SGEoG' ? (
            <EOGDialog
                stake={sgState.stake}
                eogStatus={sgState.eogStatus}
                score={matchRecord.matchScore}
                onClick={() => {
                    matchRecorder.resetCurGame()
                    if (onStartNextGame) {
                        onStartNextGame()
                    }
                }}
            />
        ) : undefined

    const minimalProps: SingleGameBoardProps = {
        sgState,
        cpState,
        dialog:eogDialog,
        ...cpListeners,
    }

    const singleGameProps: SingleGameBoardProps = isLatest
        ? {
              ...minimalProps,
              ...sgListeners,
              sgConfs,
          }
        : minimalProps

    const key = isLatest ? 'latest' : 'past' + index

    const recordedGameProps = {
        matchRecord,
        index,
        ...ssListeners,
    }

    const plyInfoProps = {
        sgState,
        cpState,
        score: matchRecord.matchScore,
    }

    return (
        <RecordedGame {...recordedGameProps}>
            <Fragment>
                <SingleGameBoard {...singleGameProps} key={key} />
                <PlyInfo {...plyInfoProps} />
            </Fragment>
        </RecordedGame>
    )
}

function asListeners(
    matchRecorder: MatchRecorder<SGState>
): Partial<SingleGameListeners> {
    return { onAwaitRoll, onEndOfGame }

    function onAwaitRoll(nextState: SGToRoll) {
        const lastState = nextState.lastState()
        const plyRecord = plyRecordForCheckerPlay(lastState.curPly)
        matchRecorder.recordPly(plyRecord, lastState)
    }

    function onEndOfGame(nextState: SGEoG) {
        const lastState = nextState.lastState()
        const plyRecord = plyRecordForCheckerPlay(lastState.curPly)
        matchRecorder.recordPly(plyRecord, lastState)
        const plyRecordEoG = plyRecordForEoG(nextState.stake, nextState.result, nextState.eogStatus)
        matchRecorder.recordEoG(plyRecordEoG)
    }
}
