import { Fragment } from 'react'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { matchStateLastGame } from 'tsgammon-core/MatchState'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { defaultPlayersConf } from '../uiparts/PlayersConf'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedCubefulGameProps = Omit<
    CubefulGameProps,
    'matchState' | 'cpState'
> & {
    matchRecord: MatchRecord<BGState>,
    onResumeState?: (index: number) => void
}

export function RecordedCubefulGame(props: RecordedCubefulGameProps) {
    const {
        resignState,
        bgState: curBGState,
        matchRecord,
        playersConf = defaultPlayersConf,
        onResumeState = () => {
            //
        },
        dialog,
        ...eventHandlers
    } = props
    const { matchState } = matchRecord
    const [cpState, cpListeners, setCPState] = useCheckerPlayListeners(
        undefined,
        eventHandlers
    )

    const {
        selectedState: { index, state: bgState },
        ssListeners,
    } = useSelectableStateWithRecord(curBGState, setCPState, onResumeState)
    const isLatest = index === undefined

    const minimalProps = {
        resignState,
        bgState,
        cpState,
        playersConf,
        dialog,
        ...cpListeners,
    }
    const cubeGameProps: CubefulGameProps = isLatest
        ? {
              ...minimalProps,
              ...eventHandlers,
              matchState,
          }
        : {
              ...minimalProps,
              matchState: matchState.isEoG
                  ? matchStateLastGame(matchState)
                  : matchState,
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
                <CubefulGame {...cubeGameProps} key={key} />
            </Fragment>
        </RecordedGame>
    )
}
