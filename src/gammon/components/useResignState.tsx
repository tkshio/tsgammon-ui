import { useState } from 'react'
import { EOGStatus } from 'tsgammon-core'
import { RSNONE } from 'tsgammon-core/dispatchers/ResignEventHandlers'
import { ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import {
    RSToOffer,
    RSDialogHandlers,
    rsDialogHandlers,
} from './RSDialogHandlers'

export function useResignState(
    acceptResign: (result: SGResult, eog: EOGStatus) => void
): {
    resignState: ResignState | RSToOffer
    resignEventHandlers: RSDialogHandlers
} {
    const [resignState, setResignState] = useState<ResignState | RSToOffer>(
        RSNONE
    )

    return {
        resignState,
        resignEventHandlers: rsDialogHandlers(setResignState, acceptResign),
    }
}
