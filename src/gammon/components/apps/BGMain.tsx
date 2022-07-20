import { Fragment, useState } from 'react'
import { Button } from '../uiparts/Button'
import { PointMatch, PointMatchProps } from './PointMatch'
import './bgMain.css'
import { Dialog } from '../uiparts/Dialog'
import { Buttons } from '../uiparts/Buttons'

export type BGMainProps = {
    //
}
type MatchChoice = 'Unlimited' | '1pt' | '3pt' | '5pt'
const matchChoice: MatchChoice[] = ['Unlimited', '1pt', '3pt', '5pt']
const defaultChoice: MatchChoice = '3pt'
type BGMainConfState = {
    tag: 'CONF'
    selected: MatchChoice
}
type BGMainState = BGMainConfState | BGMainPlayState
type BGMainPlayState = {
    tag: 'PLAY'
    selected: MatchChoice
    isTerminating: boolean
}
export function BGMain(props: BGMainProps) {
    const [matchKey, setMatchKey] = useState(0)
    const [state, setState] = useState<BGMainState>({
        tag: 'CONF',
        selected: defaultChoice,
    })

    if (state.tag === 'CONF') {
        return (
            <form>
                {matchChoice.map((value: MatchChoice) =>
                    confItem(state, value)
                )}
                <Button
                    id="startBGMatch"
                    onClick={() => {
                        setState({
                            tag: 'PLAY',
                            selected: state.selected,
                            isTerminating: false,
                        })
                    }}
                />
            </form>
        )
    } else {
        const pointMatchProps: PointMatchProps = {
            onEndOfMatch,
            matchLength: toMatchPoint(state),
            dialog: state.isTerminating ? terminateDialog(state) : undefined,
        }

        return (
            <Fragment>
                <PointMatch {...pointMatchProps} key={matchKey} />
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
    function onEndOfMatch() {
        setMatchKey((prev) => prev + 1)
        setState({ tag: 'CONF', selected: state.selected })
    }
    function toMatchPoint(state: BGMainState) {
        switch (state.selected) {
            case '1pt':
                return 1
            case '3pt':
                return 3
            case '5pt':
                return 5
            case 'Unlimited':
                return 0
        }
    }
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
                        setState({ tag: 'CONF', selected: value })
                    }}
                />
                <label htmlFor="Unlimited">{value}</label>
            </Fragment>
        )
    }
    function terminateDialog(curState: BGMainPlayState) {
        return (
            <Dialog id={'termDialog'}>
                <Fragment>
                    <div className="csscaption" />{' '}
                    <Buttons>
                        <Button id="execTerm" onClick={onEndOfMatch} />
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
}
