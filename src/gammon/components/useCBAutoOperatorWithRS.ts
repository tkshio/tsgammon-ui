import { BGEventHandlers } from 'tsgammon-core/dispatchers/BGEventHandlers'
import { CBState } from 'tsgammon-core/dispatchers/CubeGameState'
import { RSToOffer } from 'tsgammon-core/dispatchers/ResignEventHandlers'
import { ResignState } from 'tsgammon-core/dispatchers/ResignState'
import { SGState } from 'tsgammon-core/dispatchers/SingleGameState'
import { CBOperator } from './operators/CBOperator'
import { SGOperator } from './operators/SGOperator'
import { useCBAutoOperator } from './useCBAutoOperator'

export function useCBAutoOperatorWithRS(
    resignState: ResignState | RSToOffer,
    cbState: CBState,
    sgState: SGState,
    autoOperators: { cb?: CBOperator; sg?: SGOperator },
    handlers: Partial<BGEventHandlers>
) {
    // 降参のシーケンスに入っている時は、何もさせない
    // 入っていない時は、通常通りにCBAutoOperatorを使用する
    // 実際のOffer/Acceptは、EventHandlerで行い、
    // ここではキューブアクション・チェッカープレイの抑制だけ
    useCBAutoOperator(
        cbState,
        sgState,
        resignState.tag === 'RSNone' ? autoOperators : {},
        handlers
    )
}
