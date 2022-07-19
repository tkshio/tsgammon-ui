import { useState } from 'react'
import { EOGStatus } from 'tsgammon-core'
import { ResignState, RSNONE } from 'tsgammon-core/dispatchers/ResignState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { RSToOffer, RSDialogHandler, rsDialogHandler } from './RSDialogHandler'

export function useResignState(
    acceptResign: (result: SGResult, eog: EOGStatus) => void
): {
    resignState: ResignState | RSToOffer
    rsDialogHandler: RSDialogHandler
} {
    const [resignState, setResignState] = useState<ResignState | RSToOffer>(
        RSNONE
    )

    return {
        resignState,
        rsDialogHandler: rsDialogHandler(setResignState, acceptResign),
    }
}
