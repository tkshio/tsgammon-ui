import { Fragment, useState } from 'react'
import { honsugorokuConf, standardConf } from 'tsgammon-core'
import {
    bothCBAutoOperator,
    bothSGAutoOperator,
    redCBAutoOperator,
    redSGAutoOperator,
    whiteCBAutoOperator,
    whiteSGAutoOperator,
} from '../operators/autoOperators'
import {
    bothRSAutoOperator,
    redRSAutoOperator,
    whiteRSAutoOperator,
} from '../operators/RSAutoOperators'
import { defaultPlayersConf, PlayersConf } from '../PlayersConf'
import { Button } from '../uiparts/Button'
import { Buttons } from '../uiparts/Buttons'
import { Dialog } from '../uiparts/Dialog'
import { CubefulMatch, CubefulMatchProps } from './CubefulMatch'

import { BGListener } from 'tsgammon-core/dispatchers/BGListener'
import { CheckerPlayListeners } from 'tsgammon-core/dispatchers/CheckerPlayDispatcher'
import { RollListener } from 'tsgammon-core/dispatchers/RollDispatcher'
import { SingleGameListener } from 'tsgammon-core/dispatchers/SingleGameListener'
import { BoardEventHandlers } from '../boards/Board'
import './bgMain.css'
import { Cubeless } from './Cubeless'

export type BGMainProps = Partial<
    BGListener &
        RollListener &
        SingleGameListener &
        CheckerPlayListeners &
        BoardEventHandlers
>
const matchChoiceSet = {
    Unlimited: { len: 0 },
    '1pt': { len: 1 },
    '3pt': { len: 3 },
    '5pt': { len: 5 },
    '7pt': { len: 7 },
    Cubeless: { len: 0 },
}
type MatchChoice = keyof typeof matchChoiceSet
const matchChoice: MatchChoice[] = [
    'Unlimited',
    '1pt',
    '3pt',
    '5pt',
    '7pt',
    'Cubeless',
]
const defaultChoice: MatchChoice = '3pt'
const gameConfSet = {
    standard: standardConf,
    honSugoroku: honsugorokuConf,
}
type RuleLabel = keyof typeof gameConfSet
type BGMainState = BGMainConfState | BGMainPlayState
type _BGMainState = {
    autoOp: { red: boolean; white: boolean }
    playersConf: PlayersConf
    selected: MatchChoice
    recordMoves: boolean
    rule: RuleLabel
}

type BGMainConfState = _BGMainState & {
    tag: 'CONF'
}
type BGMainPlayState = _BGMainState & {
    tag: 'PLAY'
    isTerminating: boolean
}
export function BGMain(props: BGMainProps) {
    const { ...exListeners } = props
    const labels = { red: 'Red', white: 'White' }
    const [matchKey, setMatchKey] = useState(0)
    const initialConf: BGMainConfState = {
        tag: 'CONF',
        autoOp: { red: true, white: false },
        playersConf: defaultPlayersConf,
        selected: defaultChoice,
        recordMoves: true,
        rule: 'standard',
    }
    const [state, setState] = useState<BGMainState>(initialConf)

    if (state.tag === 'CONF') {
        return (
            <div id="conf">
                <h2>Configuration</h2>
                <h3>Record Moves</h3>
                {recordMovesConf(state)}
                <h3>Match Point</h3>
                {matchPointConf(state)}
                <p />
                <h3>Players name</h3>
                {playersConf(state)}
                <h3>CPU plays</h3>
                {autoOpConf(state)}
                <h3>Rule</h3>
                {gameRuleConf(state)}
                <hr />
                <Button
                    id="startBGMatch"
                    onClick={() => {
                        const newState: BGMainPlayState = {
                            ...state,
                            tag: 'PLAY',
                            selected: state.selected,
                            isTerminating: false,
                        }
                        setState(newState)
                    }}
                />
            </div>
        )
    } else {
        const bgMatchProps: CubefulMatchProps = {
            ...exListeners,
            gameConf: gameConfSet[state.rule],
            onEndOfMatch: () => onEndOfMatch(state),
            playersConf: state.playersConf,
            autoOperators: autoOp(state),
            dialog: state.isTerminating ? terminateDialog(state) : undefined,
            matchLength: matchChoiceSet[state.selected].len,
            recordMatch: state.recordMoves,
        }

        if (state.rule === 'honSugoroku' || state.selected === 'Cubeless') {
            return (
                <Fragment>
                    <Cubeless {...bgMatchProps} key={matchKey} />
                    {autoOpConf(state)}
                    {!state.isTerminating && (
                        <Button
                            id="term"
                            onClick={() => {
                                setState({ ...state, isTerminating: true })
                            }}
                        />
                    )}
                </Fragment>
            )
        }
        return (
            <Fragment>
                <CubefulMatch {...bgMatchProps} key={matchKey} />
                <div id="conf">
                    {autoOpConf(state)}
                    {!state.isTerminating && (
                        <Button
                            id="term"
                            onClick={() => {
                                setState({ ...state, isTerminating: true })
                            }}
                        />
                    )}
                </div>
            </Fragment>
        )
    }
    function recordMovesConf(state: BGMainConfState) {
        const id = 'recordMoves'
        return (
            <Fragment>
                <input
                    type="checkbox"
                    id={id}
                    value={id}
                    checked={state.recordMoves}
                    onChange={() => {
                        const nextState = {
                            ...state,
                            recordMoves: !state.recordMoves,
                        }
                        setState(nextState)
                    }}
                />
                <label htmlFor={id}>record moves</label>
            </Fragment>
        )
    }
    function autoOp(state: BGMainState) {
        const conf = state.autoOp
        if (conf.red && conf.white) {
            return {
                cb: bothCBAutoOperator(),
                sg: bothSGAutoOperator(),
                rs: bothRSAutoOperator(),
            }
        }
        if (conf.red) {
            return {
                cb: redCBAutoOperator(),
                sg: redSGAutoOperator(),
                rs: redRSAutoOperator(),
            }
        }
        if (conf.white) {
            return {
                cb: whiteCBAutoOperator(),
                sg: whiteSGAutoOperator(),
                rs: whiteRSAutoOperator(),
            }
        }
        return undefined
    }

    function autoOpConf(state: BGMainState) {
        return (
            <Fragment>
                {checkBox('red')}
                {checkBox('white')}
            </Fragment>
        )
        function checkBox(id: 'red' | 'white') {
            return (
                <Fragment>
                    {' '}
                    <input
                        type="checkbox"
                        id={id}
                        value={id}
                        checked={state.autoOp[id]}
                        onChange={() =>
                            setState({
                                ...state,
                                autoOp: {
                                    ...state.autoOp,
                                    [id]: !state.autoOp[id],
                                },
                            })
                        }
                    />
                    <label htmlFor={id}>{labels[id]}</label>
                </Fragment>
            )
        }
    }
    function onEndOfMatch(state: BGMainState) {
        setMatchKey((prev) => prev + 1)
        setState({ ...state, tag: 'CONF', selected: state.selected })
    }

    function matchPointConf(state: BGMainConfState) {
        return (
            <Fragment>
                {matchChoice.map((value: MatchChoice) =>
                    confItem(state, value)
                )}
            </Fragment>
        )
        function confItem(conf: BGMainConfState, value: MatchChoice) {
            return (
                <Fragment>
                    <input
                        type="radio"
                        name="gameConf"
                        id={value}
                        value={value}
                        checked={conf.selected === value}
                        onChange={() => {
                            const nextState: BGMainConfState = {
                                ...conf,
                                tag: 'CONF',
                                selected: value,
                            }
                            setState(nextState)
                        }}
                    />
                    <label htmlFor={value}>{value}</label>
                </Fragment>
            )
        }
    }

    function terminateDialog(curState: BGMainPlayState) {
        return (
            <Dialog id={'termDialog'}>
                <Fragment>
                    <div className="csscaption" />{' '}
                    <Buttons>
                        <Button
                            id="execTerm"
                            onClick={() => onEndOfMatch(curState)}
                        />
                        <Button
                            id="cancelTerm"
                            onClick={() => {
                                setState({
                                    ...curState,
                                    isTerminating: false,
                                })
                            }}
                        />
                    </Buttons>
                </Fragment>
            </Dialog>
        )
    }
    function playersConf(state: BGMainState) {
        const ids: ('red' | 'white')[] = ['red', 'white']
        return ids.map((id: 'red' | 'white') => {
            return (
                <p>
                    <label htmlFor={id}>{labels[id]}: </label>
                    <input
                        id={id}
                        type="field"
                        value={state.playersConf[id].name}
                        onChange={(e) => {
                            setState({
                                ...state,
                                playersConf: {
                                    ...state.playersConf,
                                    [id]: { name: e.target.value },
                                },
                            })
                        }}
                    />
                </p>
            )
        })
    }
    function gameRuleConf(state: BGMainConfState) {
        const rules: RuleLabel[] = Object.getOwnPropertyNames(
            gameConfSet
        ) as RuleLabel[]
        return <p>{rules.map((s: RuleLabel) => confItem(state, s))}</p>
        function confItem(conf: BGMainConfState, value: RuleLabel) {
            return (
                <Fragment>
                    <input
                        type="radio"
                        name="ruleConf"
                        id={value}
                        value={value}
                        checked={conf.rule === value}
                        onChange={() => {
                            const nextState: BGMainConfState = {
                                ...conf,
                                rule: value,
                            }
                            setState(nextState)
                        }}
                    />
                    <label htmlFor={value}>{gameConfSet[value].name}</label>
                </Fragment>
            )
        }
    }
}
