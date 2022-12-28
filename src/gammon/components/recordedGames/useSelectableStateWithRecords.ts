import { CheckerPlayState } from 'tsgammon-core/states/CheckerPlayState'
import { useSelectableState } from './useSelectableState'

export function useSelectableStateWithRecord<T>(
    curState: T,
    setCPState: (cpState: CheckerPlayState | undefined) => void,
    onResumeState: (index: number, state: T) => void
) {
    return useSelectableState<T>(curState, {
        onSelect: () => {
            setCPState(undefined)
        },
        onSelectLatest: () => {
            setCPState(undefined)
        },
        onResumeState: (index: number, state: T) => {
            onResumeState(index, state)
        },
    })
}
