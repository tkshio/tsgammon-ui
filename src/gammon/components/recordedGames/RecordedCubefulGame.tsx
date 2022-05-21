import { Fragment } from 'react'
import { GameConf } from 'tsgammon-core'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { MatchRecord } from 'tsgammon-core/records/MatchRecord'
import { CubefulGame, CubefulGameConfs, CubefulGameProps } from '../CubefulGame'
import {
    SingleGameEventHandlers,
} from '../eventHandlers/SingleGameEventHandlers'
import { CubeGameEventHandlers } from "../eventHandlers/CubeGameEventHandlers"
import { MatchState } from '../MatchState'
import {} from '../SingleGameBoard'
import { PlyInfo } from '../uiparts/PlyInfo'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { BGState } from '../BGState'
import { RecordedGame } from './RecordedGame'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedCubefulGameProps = {
    gameConf: GameConf
    cbConfs: CubefulGameConfs
    matchState: MatchState
    matchRecord: MatchRecord<BGState>
    bgState: BGState
    onResumeState?: (index: number) => void
} & Partial<
    CubeGameEventHandlers &
        SingleGameEventHandlers &
        CheckerPlayListeners &
        RollListener
>

export function RecordedCubefulGame(props: RecordedCubefulGameProps) {
    const {
        bgState: curBGState,
        matchRecord,
        matchState,
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

    const minimalProps = {
        ...bgState,
        cpState,
        matchState,
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
        matchRecord,
        index,
        ...ssListeners,
    }

    const plyInfoProps = {
        cbState: bgState.cbState,
        sgState: bgState.sgState,
        cpState,
        score: matchState.scoreBefore,
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
