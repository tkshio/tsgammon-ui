import React from 'react'
import { UnlimitedMatch } from './gammon/components/apps/UnlimitedMatch'
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
            <UnlimitedMatch {...args} />
        </div>
    )
}

export default App
