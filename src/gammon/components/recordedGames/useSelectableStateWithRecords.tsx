import { CheckerPlayState } from 'tsgammon-core/dispatchers/CheckerPlayState'
import { MatchRecorder } from './useMatchRecorder'
import { useSelectableState } from './useSelectableState'

export function useSelectableStateWithRecord<T>(
    curState: T,
    setCPState: (cpState: CheckerPlayState | undefined) => void,
    matchRecorder: MatchRecorder<T>,
    onResumeState: (state: T) => void
) {
    return useSelectableState<T>(curState, {
        onSelect: () => {
            setCPState(undefined)
        },
        onSelectLatest: () => {
            setCPState(undefined)
        },
        onResumeState: (index: number, state: T) => {
            matchRecorder.resumeTo(index)
            onResumeState(state)
        },
    })
}
