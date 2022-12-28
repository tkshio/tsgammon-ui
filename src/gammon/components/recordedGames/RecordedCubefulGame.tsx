import { Fragment } from 'react'
import { matchStateLastGame } from 'tsgammon-core/MatchState'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { BGState } from 'tsgammon-core/states/BGState'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { defaultPlayersConf } from '../PlayersConf'
import { useCheckerPlayListener } from '../useCheckerPlayListeners'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedCubefulGameProps = Omit<
    CubefulGameProps,
    'matchState' | 'cpState'
> & {
    matchRecord: MatchRecord<BGState>
    onResumeState?: (index: number) => void
}

export function RecordedCubefulGame(props: RecordedCubefulGameProps) {
    const {
        resignState,
        bgState: curBGState,
        matchRecord,
        gameConf,
        playersConf = defaultPlayersConf,
        onResumeState = () => {
            //
        },
        dialog,
        ...eventHandlers
    } = props
    const { matchState } = matchRecord
    const [cpState, cpListeners, setCPState] = useCheckerPlayListener(
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
        gameConf,
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
