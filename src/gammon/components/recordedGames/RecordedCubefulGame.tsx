import { Fragment } from 'react'
import { GameConf, Score } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { CubefulGame, CubefulGameConfs, CubefulGameProps } from '../CubefulGame'
import { CubeGameEventHandlers,  SingleGameEventHandlers, StartNextGameHandler } from '../EventHandlers'
import { } from '../SingleGameBoard'
import { PlyInfo } from '../uiparts/PlyInfo'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { BGState } from './BGState'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedCubefulGameProps = {
    gameConf: GameConf
    cbConfs: CubefulGameConfs
    matchScore?: Score
    matchRecord: MatchRecord<BGState>
    bgState: BGState
    onResumeState?:(index:number)=>void
} & StartNextGameHandler &
    Partial<
        CubeGameEventHandlers &
            SingleGameEventHandlers &
            CheckerPlayListeners &
            RollListener
    >

export function RecordedCubefulGame(props: RecordedCubefulGameProps) {
    const {
        bgState: curBGState,
        matchRecord,
        cbConfs = {
            sgConfs: {},
        },
        onResumeState = () => {
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
    } = useSelectableStateWithRecord(curBGState, setCPState, onResumeState)

    const isLatest = index === undefined

    const cur = matchRecord.curGameRecord

    const minimalProps = {
        ...bgState,
        cpState,
        scoreBefore: matchRecord.matchScore,
        matchLength: matchRecord.matchLength,
        isCrawfordNext: cur.isEoG && cur.isCrawford,
        isEoM: matchRecord.isEndOfMatch,
        ...cpListeners,
    }
    const cubeGameProps: CubefulGameProps = isLatest
        ? {
              ...minimalProps,
              ...eventHandlers,
              cbConfs,
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
