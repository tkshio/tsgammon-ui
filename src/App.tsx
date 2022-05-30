import React from 'react'
import { PointMatch } from './gammon/components/apps/PointMatch'
import {
    redCBAutoOperator,
    redSGAutoOperator,
} from './gammon/components/operators/autoOperators'

import './App.css'

function App() {
    const args = {
        cbConfs: {
            sgConfs: {},
        },
        autoOperators: {
            sg: redSGAutoOperator(),
            cb: redCBAutoOperator(),
        },
    }
    return (
        <div className="App">
            <PointMatch {...args} />
        </div>
    )
}

export default App
