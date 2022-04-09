import {
    plyRecordForCheckerPlay,
    plyRecordForDouble,
    plyRecordForEoG,
    plyRecordForPass,
    plyRecordForTake,
} from 'tsgammon-core/records/PlyRecord'
import { CheckerPlayListeners } from '../../dispatchers/CheckerPlayDispatcher'
import {
    CubeGameListeners,
    decorate as decorateCB,
} from '../../dispatchers/CubeGameDispatcher'
import { CBEoG, CBResponse, CBToRoll } from '../../dispatchers/CubeGameState'
import { RollListener } from '../../dispatchers/RollDispatcher'
import {
    decorate as decorateSG,
    SingleGameListeners,
} from '../../dispatchers/SingleGameDispatcher'
import { SGEoG, SGToRoll } from '../../dispatchers/SingleGameState'
import {
    CubefulGameBoard,
    CubefulGameBoardProps,
    CubefulGameConfs,
} from '../CubefulGameBoard'
import { EOGDialog } from '../uiparts/EOGDialog'
import { PlyInfo } from '../uiparts/PlyInfo'
import { useCheckerPlayListeners } from '../useCheckerPlayListeners'
import { BGState } from './BGState'
import { RecordedGame } from './RecordedGame'
import { MatchRecorder, useMatchRecorder } from './useMatchRecorder'
import { useSelectableStateWithRecord } from './useSelectableStateWithRecords'

export type RecordedCubefulGameProps = {
    bgState: BGState

    onStartNextGame: () => void
    onResumeState: (state: BGState) => void
    cbConfs: CubefulGameConfs
} & CubeGameListeners &
    SingleGameListeners &
    Partial<CheckerPlayListeners & RollListener>

export function RecordedCubefulGame(props: RecordedCubefulGameProps) {
    const {
        bgState: curBGState,
        cbConfs = {
            sgConfs: {},
        },
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
    const [matchRecord, matchRecorder] = useMatchRecorder<BGState>()
    const {
        selectedState: { index, state: bgState },
        ssListeners,
    } = useSelectableStateWithRecord(
        curBGState,
        setCPState,
        matchRecorder,
        onResumeState
    )

    const isLatest = index === undefined

    const cbListeners: CubeGameListeners = decorateCB(
        asCBListeners(matchRecorder, bgState),
        listeners
    )
    const sgListeners: SingleGameListeners = decorateSG(
        asSGListeners(matchRecorder, bgState),
        listeners
    )

    const eogDialog =
        bgState.cbState.tag === 'CBEoG' ? (
            <EOGDialog
                {...{
                    ...bgState.cbState,
                    score: matchRecord.score,
                    onClick: () => {
                        matchRecorder.resetCurGame()
                        onStartNextGame()
                    },
                }}
            />
        ) : undefined

    const minimalProps = {
        ...bgState,
        cpState,
        scoreBefore: matchRecord.score,
        ...cpListeners,
    }
    const cubeGameProps: CubefulGameBoardProps = isLatest
        ? {
              ...minimalProps,
              ...cbListeners,
              ...sgListeners,
              cbConfs,
              eogDialog,
          }
        : minimalProps

    const key = isLatest ? 'latest' : 'past' + index

    const recordedGameProps = {
        matchRecord: matchRecord,
        index,
        ...ssListeners,
    }

    const plyInfoProps = {
        cbState: bgState.cbState,
        sgState: bgState.sgState,
        cpState,
        score: matchRecord.score,
    }

    return (
        <RecordedGame {...recordedGameProps}>
            <div className="boardContainer">
                <CubefulGameBoard {...cubeGameProps} key={key} />
                <PlyInfo {...plyInfoProps} />
            </div>
        </RecordedGame>
    )
}

function asCBListeners(
    matchRecorder: MatchRecorder<BGState>,
    state: BGState
): Partial<CubeGameListeners> {
    return { onDouble, onTake, onEndOfCubeGame }

    function onDouble(nextState: CBResponse) {
        const plyRecord = plyRecordForDouble(
            nextState.cubeState,
            nextState.isDoubleFromRed
        )
        matchRecorder.recordPly(plyRecord, state)
    }

    function onTake(nextState: CBToRoll) {
        const plyRecord = plyRecordForTake(!nextState.isRed)
        matchRecorder.recordPly(plyRecord, state)
    }

    function onEndOfCubeGame(nextState: CBEoG) {
        if (nextState.isWonByPass) {
            const plyRecord = plyRecordForPass(nextState.result)
            matchRecorder.recordPly(plyRecord, state)
        }
        const plyRecordEoG = plyRecordForEoG(nextState.stake, nextState.result)
        matchRecorder.recordEoG(plyRecordEoG)
    }
}

function asSGListeners(
    matchRecorder: MatchRecorder<BGState>,
    state: BGState
): Partial<SingleGameListeners> {
    return { onAwaitRoll: recordPly, onEndOfGame: recordPly }

    function recordPly(nextState: SGToRoll | SGEoG) {
        const lastState = nextState.lastState()
        const plyRecord = plyRecordForCheckerPlay(lastState.curPly)
        matchRecorder.recordPly(plyRecord, {
            cbState: state.cbState,
            sgState: lastState,
        })
    }
}
