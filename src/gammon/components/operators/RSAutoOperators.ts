import { BoardState, BoardStateNode, CubeState } from 'tsgammon-core'
import { ResignOffer } from 'tsgammon-core/dispatchers/ResignState'
import { RSOperator } from './RSOperator'

export function redRSAutoOperator(): RSOperator {
    return {
        operateRedOfferAction: doOfferAction,
        operateWhiteOfferAction: () => {
            //
        },
        operateRedResignResponse: doResponse,
        operateWhiteResignResponse: () => {
            return false
        },
    }
}

function doOfferAction(
    doOffer: (offer: ResignOffer) => void,
    _: ResignOffer | undefined,
    __: CubeState,
    boardState: BoardState,
    node?: BoardStateNode
) {
    // ロールしてから判断する
    if (node === undefined) {
        return
    }
    // ゾロ目の場合はResignしない
    if (node.dices.length === 4) {
        return
    }
    // ベアオフが始まっていたらResignしない
    if (boardState.myBornOff > 0) {
        return
    }

    // コンタクトがあるうちはResignしない
    if (!boardState.isRunningGame()) {
        return
    }

    // 自駒は15個でゾロ目でない＝今出ているロールと、さらに4ロール必要
    // 相手のコマが2個でpipが12以下（最悪で4ロール）ならResignする
    if (
        boardState.opponentPieceCount <= 2 &&
        boardState.opponentPipCount <= 12
    ) {
        // シングル負けをオファー
        doOffer(ResignOffer.Single)
        // Gammon, Backgammonのオファーは未実装
    }

    return
}

function doResponse(
    offer: ResignOffer,
    doAccept: () => void,
    doReject: () => void,
    cube: CubeState,
    boardState: BoardState,
    node?: BoardStateNode
) {
    if ((offer === ResignOffer.Single) && boardState.myBornOff === 0 ){
        doReject()
    }else{
        doAccept()
    }
    return true
}
