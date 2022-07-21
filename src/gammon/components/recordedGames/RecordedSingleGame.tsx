import { Fragment } from 'react'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { defaultPlayersConf } from '../uiparts/PlayersConf'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedSingleGameProps = Omit<SingleGameProps, 'cpState'|'matchScore'> &{
    matchRecord: MatchRecord<SGState>
    onResumeState?: (index: number) => void
}
export function RecordedSingleGame(props: RecordedSingleGameProps) {
    const {
        resignState,
        sgState: curSGState,
        matchRecord,
        playersConf = defaultPlayersConf,
        onResumeState = () => {
            //
        },
        dialog,
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
        resignState,
        sgState,
        cpState,
        matchScore:matchRecord.matchState.score,
        playersConf,
        dialog,
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
        playersConf,
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
