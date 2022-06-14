import { BoardState, BoardStateNode } from 'tsgammon-core';
import { ResignOffer } from 'tsgammon-core/dispatchers/ResignState';

export type RSOperator = {
    operateRedOfferAction: (
        doOffer: (offer: ResignOffer) => void,
        boardState: BoardState,
        node?: BoardStateNode
    ) => void;
    operateWhiteOfferAction: (
        doOffer: (offer: ResignOffer) => void,
        boardState: BoardState,
        node?: BoardStateNode
    ) => void;
};
