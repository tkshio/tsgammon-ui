import { CheckerPlayState } from 'tsgammon-core/states/CheckerPlayState'
import {
    SelectableState,
    SelectableStateListeners,
    useSelectableState,
} from './useSelectableState'

export function useSelectableStateWithRecord<T>(
    curState: T,
    setCPState: (cpState: CheckerPlayState | undefined) => void,
    onResumeState: (index: number, state: T) => void
): {
    selectedState: SelectableState<T>
    ssListeners: SelectableStateListeners<T>
} {
    return useSelectableState<T>(curState, {
        onSelect: () => {
            setCPState(undefined)
        },
        onSelectLatest: () => {
            setCPState(undefined)
        },
        onResumeState,
    })
}
