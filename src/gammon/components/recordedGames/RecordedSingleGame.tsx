import { Fragment } from 'react'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameEventHandlers } from 'tsgammon-core/dispatchers/SingleGameEventHandlers'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { SingleGameConfs } from '../SingleGameBoard'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedSingleGameProps = {
    sgState: SGState
    sgConfs: SingleGameConfs
    matchRecord: MatchRecord<SGState>
    onResumeState?: (index: number) => void
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

    const minimalProps: Omit<SingleGameProps, 'onStartNextGame'> = {
        sgState,
        cpState,
        sgConfs,
        ...cpListeners,
    }

    const singleGameProps: SingleGameProps = isLatest
        ? {
              ...minimalProps,
              ...listeners,
          }
        : {
              ...minimalProps,
          }

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
