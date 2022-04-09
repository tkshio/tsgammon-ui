import { useEffect, useState } from 'react'
import './copyTextButton.css'

export function CopyTextButton(props: {
    getText: () => string
    caption?: string
    timeOut?: number
}) {
    // マッチ記録コピー時、メッセージを一瞬だけ表示させるためのフラグ
    const [runAnimation, setRunAnimation] = useState(false)
    const { getText, caption = 'copy', timeOut = 500 } = props
    // CopyMatchLogのメッセージの解除
    useEffect(() => {
        if (runAnimation) {
            setTimeout(() => {
                setRunAnimation(false)
            }, timeOut)
        }
    })
    if (navigator?.clipboard === undefined) {
        return null
    }
    return (
        <div id={'copy'}>
            <div
                id={'copiedMessage'}
                className={runAnimation ? 'runAnimation' : 'disabled'}
            >
                copied.
            </div>
            <div
                id={'copyMatchRecords'}
                className={
                    'button' +
                    (navigator?.clipboard === undefined ? ' disabled' : '')
                }
                onClick={() => {
                    const text = getText()
                    navigator?.clipboard?.writeText(text).then(() => {
                        setRunAnimation(true)
                    })
                }}
            >
                {caption}
            </div>
        </div>
    )
}
