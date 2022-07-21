import React, { Fragment } from 'react'
import { Dialog } from './Dialog'
import './button.css'
import './cubeResponseDialog.css'
import { Buttons } from './Buttons'
import { Button } from './Button'

export type CubeResponseDialogProps = {
    player?: string
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
        <Dialog
            {...{
                msgs: [`${props.player??'Oppenent'} offers Double.`],
                onClick: () => {
                    //
                },
            }}
        >
            <div className="cubeResponse">
                <Buttons>
                    <Fragment>
                        {' '}
                        <Button id="take" onClick={() => props.onTake()} />
                        <Button id="pass" onClick={() => props.onPass()} />
                    </Fragment>
                </Buttons>
            </div>
        </Dialog>
    )
}
