import { Fragment } from 'react'
import { GameConf, standardConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    SingleGameListeners
} from 'tsgammon-core/dispatchers/SingleGameDispatcher'
import { SGEoG, SGState, SGToRoll } from 'tsgammon-core/dispatchers/SingleGameState'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import {
    plyRecordForCheckerPlay,
    plyRecordForEoG
} from 'tsgammon-core/records/PlyRecord'
import {
    SingleGameBoard,
    SingleGameBoardProps,
    SingleGameConfs,
    SingleGameEventHandlers
} from '../SingleGameBoard'
import { EOGDialog } from '../uiparts/EOGDialog'
import { PlyInfo } from '../uiparts/PlyInfo'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { RecordedGame } from './RecordedGame'
import { MatchRecorder } from './useMatchRecorder'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedSingleGameProps = {
    sgState: SGState
    sgConfs: SingleGameConfs
    matchRecord:MatchRecord<SGState>
    onStartNextGame: () => void
    onResumeState: (index:number, state: SGState) => void
} & SingleGameEventHandlers &
    Partial<CheckerPlayListeners & RollListener>

export function RecordedSingleGame(props: RecordedSingleGameProps) {
    const {
        sgState: curSGState,
        sgConfs = {},
        matchRecord,
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
    const {
        selectedState: { index, state: sgState },
        ssListeners,
    } = useSelectableStateWithRecord(
        curSGState,
        setCPState,
        onResumeState
    )

    const isLatest = index === undefined



    const eogDialog =
        sgState.tag === 'SGEoG' ? (
            <EOGDialog
                stake={sgState.stake}
                eogStatus={sgState.eogStatus}
                score={matchRecord.matchScore}
                onClick={() => {
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
              ...listeners,
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
