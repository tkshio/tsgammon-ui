import { Fragment } from 'react'
import { matchStateLastGame } from 'tsgammon-core/MatchState'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { BGState } from 'tsgammon-core/states/BGState'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { defaultPlayersConf } from '../PlayersConf'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedCubefulGameProps = Omit<CubefulGameProps, 'matchState'> & {
    matchRecord: MatchRecord<BGState>
    onResumeState?: (index: number) => void
    clearCPState: () => void
}

export function RecordedCubefulGame(props: RecordedCubefulGameProps) {
    const {
        resignState,
        bgState: curBGState,
        cpState,
        matchRecord,
        gameConf,
        playersConf = defaultPlayersConf,
        onResumeState = () => {
            //
        },
        clearCPState,
        dialog,
        ...eventHandlers
    } = props
    const { matchState } = matchRecord
    const {
        selectedState: { index, state: bgState },
        ssListeners,
    } = useSelectableStateWithRecord(curBGState, clearCPState, onResumeState)
    const isLatest = index === undefined

    const minimalProps = {
        resignState,
        bgState,
        cpState,
        gameConf,
        playersConf,
        dialog,
    }
    const cubeGameProps: CubefulGameProps = isLatest
        ? {
              ...minimalProps,
              ...eventHandlers,
              matchState,
          }
        : {
              ...minimalProps,
              ...eventHandlers,
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
