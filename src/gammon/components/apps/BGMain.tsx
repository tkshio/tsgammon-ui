import { Fragment, useState } from 'react'
import { Button } from '../uiparts/Button'
import { PointMatch, PointMatchProps } from './PointMatch'
import './bgMain.css'

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
type BGMainState = BGMainConfState | { tag: 'PLAY'; selected: MatchChoice }
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
                <Button id='startBGMatch'
                    onClick={() => {
                        setState({ tag: 'PLAY', selected: state.selected })
                    }}
                />
            </form>
        )
    } else {
        const pointMatchProps: PointMatchProps = {
            onEndOfMatch: () => {
                setMatchKey((prev) => prev + 1)
                setState({ tag: 'CONF', selected: state.selected })
            },
            matchLength: toMatchPoint(state),
        }

        return <PointMatch {...pointMatchProps} key={matchKey} />
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
}
