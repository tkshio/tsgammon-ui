import { Fragment } from 'react'
import { eog, GameConf, Score, score } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import {
    MatchRecord
} from 'tsgammon-core/records/MatchRecord'
import { CubefulGame, CubefulGameConfs, CubefulGameProps } from '../CubefulGame'
import { CubeGameEventHandlers } from '../CubefulGameBoard'
import { SingleGameEventHandlers } from '../SingleGameBoard'
import { EOGDialog } from '../uiparts/EOGDialog'
import { PlyInfo } from '../uiparts/PlyInfo'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { BGState } from './BGState'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'


export type RecordedCubefulGameProps = {
    gameConf: GameConf
    matchLength: number
    cbConfs: CubefulGameConfs
    matchScore?: Score
    matchRecord:MatchRecord<BGState>
    isCrawford?: boolean
    bgState: BGState
    onStartNextGame: (matchRecord: MatchRecord<BGState>) => void
    onResumeState: (index:number, state: BGState) => void
    onEndOfMatch: (matchRecord: MatchRecord<BGState>) => void
} & Partial<
    CubeGameEventHandlers &
        SingleGameEventHandlers &
        CheckerPlayListeners &
        RollListener
>

export function RecordedCubefulGame(props: RecordedCubefulGameProps) {
    const {
        bgState: curBGState,
        matchLength,
        matchRecord,
        cbConfs = {
            sgConfs: {},
        },
        onResumeState = () => {
            //
        },
        onStartNextGame = () => {
            //
        },
        onEndOfMatch = () => {
            //
        },
        ...eventHandlers
    } = props

    const [cpState, cpListeners, setCPState] = useCheckerPlayListeners(
        undefined,
        eventHandlers
    )


    const {
        selectedState: { index, state: bgState },
        ssListeners,
    } = useSelectableStateWithRecord(
        curBGState,
        setCPState,
        onResumeState // onResumeState must call matchRecorder.resumeState()
    )

    const isLatest = index === undefined

    const isEoM = matchRecord.isEndOfMatch

    const cur = matchRecord.curGameRecord
    const { eogStatus, stake } = cur.isEoG
        ? {
              eogStatus: cur.eogRecord.eogStatus,
              stake: cur.eogRecord.stake,
          }
        : { eogStatus: eog(), stake: score() }

    const eogDialog =
        bgState.cbState.tag === 'CBEoG' ? (
            <EOGDialog
                {...{
                    eogStatus,
                    stake,
                    score: matchRecord.matchScore,
                    matchLength: matchRecord.matchLength,
                    isCrawfordNext: cur.isEoG && cur.isCrawfordNext,
                    isEoM,
                    onClick: () => {
                        if (isEoM) {
                            onEndOfMatch(matchRecord)
                        } else {
                            // matchRecorder.resetCurGame()
                            onStartNextGame(matchRecord)
                        }
                    },
                }}
            />
        ) : undefined

    const minimalProps = {
        ...bgState,
        cpState,
        scoreBefore: matchRecord.matchScore,
        matchLength: matchRecord.matchLength,
        isCrawford: cur.isCrawford,
        ...cpListeners,
    }
    const cubeGameProps: CubefulGameProps = isLatest
        ? {
              ...minimalProps,
              ...eventHandlers,
              cbConfs,
              dialog: eogDialog,
          }
        : minimalProps

    const key = isLatest ? 'latest' : 'past' + index

    const recordedGameProps = {
        matchRecord: matchRecord,
        index,
        ...ssListeners,
    }

    const plyInfoProps = {
        cbState: bgState.cbState,
        sgState: bgState.sgState,
        cpState,
        score: matchRecord.matchScore,
    }

    return (
        <RecordedGame {...recordedGameProps}>
            <Fragment>
                <CubefulGame {...cubeGameProps} key={key} />
                <PlyInfo {...plyInfoProps} />
            </Fragment>
        </RecordedGame>
    )
}
