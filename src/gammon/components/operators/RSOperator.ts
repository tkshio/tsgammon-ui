import { BoardState, BoardStateNode, CubeState } from 'tsgammon-core'
import { ResignOffer } from 'tsgammon-core/dispatchers/ResignState'

export type RSOperator = {
    operateRedOfferAction: (
        doOffer: (offer: ResignOffer) => void,
        rejected: ResignOffer | undefined,
        cube: CubeState,
        boardState: BoardState,
        node?: BoardStateNode
    ) => void
    operateWhiteOfferAction: (
        doOffer: (offer: ResignOffer) => void,
        rejected: ResignOffer | undefined,
        cube: CubeState,
        boardState: BoardState,
        node?: BoardStateNode
    ) => void
    operateRedResignResponse: (
        offer: ResignOffer,
        doAccept: () => void,
        doReject: () => void,
        cube: CubeState,
        boardState: BoardState,
        node?: BoardStateNode
    ) => boolean
    operateWhiteResignResponse: (
        offer: ResignOffer,
        doAccept: () => void,
        doReject: () => void,
        cube: CubeState,
        boardState: BoardState,
        node?: BoardStateNode
    ) => boolean
}
