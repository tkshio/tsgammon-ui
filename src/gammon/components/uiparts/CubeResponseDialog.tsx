import React from 'react'
import { Dialog } from './Dialog'
import './button.css'
import './cubeResponseDialog.css'

export type CubeResponseDialogProps = {
    onTake: () => void
    onPass: () => void
}

/**
 * キューブレスポンスのための、すなわちTake/Passのみを指定可能なダイアログを表示する
 * @param props.dispatcher 指定されたGammonMessageを受け取るdispatcher
 * @constructor
 */
export function CubeResponseDialog(props: CubeResponseDialogProps) {
    return (
        <Dialog {...{ msgs: [], onClick: () => {
            //
        } }}>
            <div className="cubeResponse">
                <div className="csscaption" />
                <div className="buttons">
                    {' '}
                    <div
                        className={'button take'}
                        onClick={() => props.onTake()}
                    ></div>
                    <div
                        className={'button pass'}
                        onClick={() => props.onPass()}
                    ></div>
                </div>
            </div>
        </Dialog>
    )
}
