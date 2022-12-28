import { useState } from 'react'
import { EOGStatus } from 'tsgammon-core'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { ResignState, RSNONE } from 'tsgammon-core/states/ResignState'
import { RSDialogHandler, rsDialogHandler, RSToOffer } from './RSDialogHandler'

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
