import React from 'react'
import { PointMatch } from './gammon/components/apps/PointMatch'
import {
    redCBAutoOperator,
    redSGAutoOperator,
} from './gammon/dispatchers/autoOperators'

import './App.css'

function App() {
    const args = {
        cbConfs: {
            autoOperator: redCBAutoOperator(),
            sgConfs: { autoOperator: redSGAutoOperator() },
        },
    }
    return (
        <div className="App">
            <PointMatch {...args} />
        </div>
    )
}

export default App
