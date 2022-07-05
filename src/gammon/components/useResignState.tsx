import { useState } from 'react'
import { EOGStatus } from 'tsgammon-core'
import { ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { SGResult } from 'tsgammon-core/records/SGResult'
import { resignEventHandlers, RSNONE } from './ResignEventHandlers'
import { RSToOffer } from './uiparts/ResignDialog'

export function useResignState(
    acceptResign: (result: SGResult, eog: EOGStatus) => void
) {
    const [resignState, setResignState] = useState<ResignState | RSToOffer>(
        RSNONE
    )

    // 必要な状態管理機能を集約
    return {
        resignState,
        resignEventHandlers: resignEventHandlers(setResignState, acceptResign),
    }
}
