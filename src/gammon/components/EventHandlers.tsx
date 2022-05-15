import { BoardStateNode, EOGStatus } from 'tsgammon-core';
import {
    CBAction,
    CBInPlay,
    CBOpening,
    CBResponse,
    CBState,
    CBToRoll
} from 'tsgammon-core/dispatchers/CubeGameState';
import { SGInPlay, SGOpening, SGState, SGToRoll } from 'tsgammon-core/dispatchers/SingleGameState';
import { SGResult } from 'tsgammon-core/records/SGResult';


export type GameEventHandlers = {
    onEndOfMatch: () => void;
    onStartNextGame: () => void;
    onResumeState: (index: number) => void;    
};

export type CubeGameEventHandlers = {
    onTake: (cbState: CBResponse) => void
    onPass: (cbState: CBResponse) => void
    onDouble: (cbState: CBAction) => void

    onStartOpeningCheckerPlay: (cbState: CBOpening, isRed: boolean) => void
    onStartCheckerPlay: (cbState: CBToRoll | CBAction) => void
    onStartCubeAction: (cbState: CBInPlay) => void
    onSkipCubeAction: (cbState: CBAction) => void
    onEndOfCubeGame: (
        cbState: CBState,
        result: SGResult.REDWON | SGResult.WHITEWON,
        eogStatus: EOGStatus
    ) => void
    onSetCBState: (cbState?: CBState) => void
}

export type SingleGameEventHandlers = {
    onCommit: (sgState: SGInPlay, node: BoardStateNode) => void
    onRoll: (sgState: SGToRoll) => void
    onRollOpening: (sgState: SGOpening) => void
    onSetSGState: (sgState?: SGState) => void
}