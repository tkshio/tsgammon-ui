import { Fragment } from 'react'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { SGState } from 'tsgammon-core/states/SingleGameState'
import { CheckerPlayListeners } from '../dispatchers/CheckerPlayDispatcher'
import { defaultPlayersConf } from '../PlayersConf'
import { SingleGame, SingleGameProps } from '../SingleGame'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedSingleGameProps = Omit<SingleGameProps, 'matchScore'> & {
    matchRecord: MatchRecord<SGState>
    onResumeState?: (index: number) => void
    clearCPState: () => void
}
export function RecordedSingleGame(props: RecordedSingleGameProps) {
    const {
        resignState,
        cpState,
        sgState: curSGState,
        matchRecord,
        gameConf,
        playersConf = defaultPlayersConf,
        onResumeState = () => {
            //
        },
        clearCPState,
        dialog,
        ...listeners
    } = props

    const cpListeners: Partial<CheckerPlayListeners> = listeners
    const {
        selectedState: { index, state: sgState },
        ssListeners,
    } = useSelectableStateWithRecord(curSGState, clearCPState, onResumeState)

    const isLatest = index === undefined

    const minimalProps: Omit<SingleGameProps, 'onStartNextGame'> = {
        resignState,
        sgState,
        cpState,
        matchScore: matchRecord.matchState.score,
        gameConf,
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
