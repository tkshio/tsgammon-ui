import { useState } from 'react'
import {
    ResignState
} from 'tsgammon-core/dispatchers/ResignState'
import { resignEventHandlers, RSNONE } from './ResignEventHandlers'
import { RSToOffer } from './uiparts/ResignDialog'


export function useResignState() {
    const [resignState, setResignState] = useState<
        ResignState | RSToOffer
    >(RSNONE)

    // 必要な状態管理機能を集約
    return {
        resignState,
        resignEventHandlers: resignEventHandlers(setResignState),
    }
}
