import React from 'react';
import {UnlimitedMatch} from "./gammon/components/UnlimitedMatch";
import {whiteSideAutoOperator, whiteSideBoardOperator} from "./gammon/models/GameOperators";
import {dnEngine} from "./gammon/engines/SimpleNNGammon";
import {stateBuilder} from "./gammon/models/GameState";
import "./App.css"

function App() {
    const args = {
        initialState: stateBuilder.initGameState(),
        boardOperator: whiteSideBoardOperator(),
        autoOperator: whiteSideAutoOperator(dnEngine()),
    }
    return (
        <div className="App">
            <UnlimitedMatch {...args}/>
        </div>
    );
}

export default App;
