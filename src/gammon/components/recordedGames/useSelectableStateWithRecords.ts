import {
    SelectableState,
    SelectableStateListeners,
    useSelectableState,
} from './useSelectableState'

export function useSelectableStateWithRecord<T>(
    curState: T,
    clearCurState: () => void,
    onResumeState: (index: number, state: T) => void
): {
    selectedState: SelectableState<T>
    ssListeners: SelectableStateListeners<T>
} {
    return useSelectableState<T>(curState, {
        onSelect: () => {
            clearCurState()
        },
        onSelectLatest: () => {
            clearCurState()
        },
        onResumeState,
    })
}
