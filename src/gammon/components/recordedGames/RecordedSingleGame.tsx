import { Fragment } from 'react'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { SingleGame, SingleGameProps } from '../SingleGame'
import {
    SingleGameBoardProps,
    SingleGameConfs,
    SingleGameEventHandlers
} from '../SingleGameBoard'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedSingleGameProps = {
    sgState: SGState
    sgConfs: SingleGameConfs
    matchRecord: MatchRecord<SGState>
    onStartNextGame: () => void
    onResumeState: (index: number, state: SGState) => void
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
    } = useSelectableStateWithRecord(curSGState, setCPState, onResumeState)

    const isLatest = index === undefined

    const minimalProps: SingleGameBoardProps = {
        sgState,
        cpState,
        sgConfs,
        ...cpListeners,
    }

    const singleGameProps: SingleGameProps = isLatest
        ? {
              ...minimalProps,
              onStartNextGame,
              ...listeners,
          }
        : minimalProps

    const key = isLatest ? 'latest' : 'past' + index

    const recordedGameProps = {
        matchRecord,
        index,
        ...ssListeners,
    }

    return (
        <RecordedGame {...recordedGameProps}>
            <Fragment>
                <SingleGame {...singleGameProps} key={key} />
            </Fragment>
        </RecordedGame>
    )
}
