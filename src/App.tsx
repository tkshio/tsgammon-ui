import React from 'react'
import { BGMain } from './gammon/apps/BGMain'

import './App.css'

function App() {
    const args = {}
    return (
        <div className="App">
            <BGMain {...args} />
        </div>
    )
}

export default App
