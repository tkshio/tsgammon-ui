import { useState } from 'react'
import { EOGStatus } from 'tsgammon-core'
import { RSNONE } from 'tsgammon-core/dispatchers/ResignEventHandlers'
import { ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import {
    RSToOffer,
    RSDialogHandler,
    rsDialogHandler,
} from './RSDialogHandlers'

export function useResignState(
    acceptResign: (result: SGResult, eog: EOGStatus) => void
): {
    resignState: ResignState | RSToOffer
    resignEventHandlers: RSDialogHandler
} {
    const [resignState, setResignState] = useState<ResignState | RSToOffer>(
        RSNONE
    )

    return {
        resignState,
        resignEventHandlers: rsDialogHandler(setResignState, acceptResign),
    }
}
