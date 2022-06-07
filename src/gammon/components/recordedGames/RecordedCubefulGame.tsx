import { Fragment } from 'react'
import { GameConf } from 'tsgammon-core'
import { BGEventHandlers } from 'tsgammon-core/dispatchers/BGEventHandlers'
import { BGState } from 'tsgammon-core/dispatchers/BGState'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { matchStateLastGame } from 'tsgammon-core/dispatchers/MatchState'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { CubefulGame, CubefulGameConfs, CubefulGameProps } from '../CubefulGame'
import { CBOperator } from '../operators/CBOperator'
import { SGOperator } from '../operators/SGOperator'
import { PlyInfo } from '../uiparts/PlyInfo'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedCubefulGameProps = {
    gameConf: GameConf
    cbConfs: CubefulGameConfs
    autoOperators?: { sg?: SGOperator; cb?: CBOperator }
    matchRecord: MatchRecord<BGState>
    bgState: BGState
    onResumeState?: (index: number) => void
} & Partial<BGEventHandlers & CheckerPlayListeners & RollListener>

export function RecordedCubefulGame(props: RecordedCubefulGameProps) {
    const {
        bgState: curBGState,
        matchRecord,
        cbConfs = {
            sgConfs: {},
        },
        autoOperators,
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
              cbConfs,
              autoOperators,
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
