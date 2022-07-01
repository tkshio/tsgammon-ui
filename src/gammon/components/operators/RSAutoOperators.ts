import { BoardState, BoardStateNode, CubeState } from 'tsgammon-core'
import { ResignOffer } from 'tsgammon-core/dispatchers/ResignState'
import { RSOperator } from './RSOperator'

export type RSOperations = {
    offerAction: (
        doOffer: (offer: ResignOffer) => void,
        offer: ResignOffer | undefined,
        cubeState: CubeState,
        boardState: BoardState,
        node?: BoardStateNode
    ) => void
    offerResponse: (
        offer: ResignOffer,
        doAccept: () => void,
        doReject: () => void,
        cube: CubeState,
        boardState: BoardState,
        node?: BoardStateNode
    ) => boolean
}

export function redRSAutoOperator(operations?: RSOperations): RSOperator {
    return {
        operateRedOfferAction: operations?.offerAction ?? doOfferAction,
        operateWhiteOfferAction: () => {
            //
        },
        operateRedResignResponse: operations?.offerResponse ?? doResponse,
        operateWhiteResignResponse: () => {
            return false
        },
    }
}

export function whiteRSAutoOperator(operations?: RSOperations): RSOperator {
    return {
        operateWhiteOfferAction: operations?.offerAction ?? doOfferAction,
        operateRedOfferAction: () => {
            //
        },
        operateWhiteResignResponse: operations?.offerResponse ?? doResponse,
        operateRedResignResponse: () => {
            return false
        },
    }
}
export function bothRSAutoOperator(
    redOperations?: RSOperations,
    whiteOperations?: RSOperations
): RSOperator {
    return {
        operateWhiteOfferAction: whiteOperations?.offerAction ?? doOfferAction,
        operateRedOfferAction: redOperations?.offerAction ?? doOfferAction,
        operateWhiteResignResponse:
            whiteOperations?.offerResponse ?? doResponse,
        operateRedResignResponse: redOperations?.offerResponse ?? doResponse,
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
    if (offer === ResignOffer.Single && boardState.myBornOff === 0) {
        doReject()
    } else {
        doAccept()
    }
    return true
}
