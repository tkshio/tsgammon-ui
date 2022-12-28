import { RSOffered } from 'tsgammon-core/states/ResignState'
import { ResignOffer } from 'tsgammon-core/ResignOffer'

/**
 * 降参のための一連の操作として提供されるインターフェース
 */
export type ResignEventHandler = {
    // 降参を申し出る
    onOfferResign: (offer: ResignOffer, isRed: boolean) => void

    // 相手の降参を拒否する
    onRejectResign: (resignState: RSOffered) => void

    // 相手の降参を受諾する（勝利）
    onAcceptResign: (resignState: RSOffered) => void
}
