import { Fragment } from 'react'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { matchStateLastGame } from 'tsgammon-core/dispatchers/MatchState'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { CubefulGame, CubefulGameProps } from '../CubefulGame'
import { PlyInfo } from '../uiparts/PlyInfo'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedCubefulGameProps = Omit<CubefulGameProps, 'matchState'|'cpState'> & {
    matchRecord: MatchRecord<BGState>
    onResumeState?: (index: number) => void
}

export function RecordedCubefulGame(props: RecordedCubefulGameProps) {
    const {
        bgState: curBGState,
        matchRecord,
        opConfs,
        onResumeState = () => {
            //
        },
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
        bgState,
        cpState,
        ...cpListeners,
    }
    const cubeGameProps: CubefulGameProps = isLatest
        ? {
              ...minimalProps,
              ...eventHandlers,
              matchState,
              opConfs,
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
        index,
        ...ssListeners,
    }

    const plyInfoProps = {
        ...cubeGameProps.bgState,
        cpState,
        score: cubeGameProps.matchState.score,
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
