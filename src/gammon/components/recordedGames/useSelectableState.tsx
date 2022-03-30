import { useState } from 'react';

export type SelectableState<T> = {
    index: number | undefined,
    state: T
}

export type SelectableStateListeners<T> = {
    onSelect: (selected: SelectableState<T>) => void
    onSelectLatest: () => void
    onResumeState: (index: number, state: T) => void
}

export function useSelectableState<T>(curState: T, listeners: SelectableStateListeners<T>): {
    selectedState: SelectableState<T>
    ssListeners: SelectableStateListeners<T>
} {
    const [selected, setSelected] = useState<SelectableState<T> | undefined>()

    const selectedStateListeners = {
        onSelect: (selectedState: SelectableState<T>) => {
            setSelected(selectedState)
            listeners.onSelect(selectedState)
        },    
         onSelectLatest: () => {
            setSelected(undefined)
            listeners.onSelectLatest()
        },
         onResumeState: (index: number, state: T) => {
            setSelected(undefined)
            listeners.onResumeState(index, state)
        }
    }

    const state: T = selected ? { ...curState, ...selected.state } : curState;
    return {
        selectedState: { index: selected?.index, state },
        ssListeners: selectedStateListeners,
    };
}
