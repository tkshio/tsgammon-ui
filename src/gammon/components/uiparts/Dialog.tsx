import React from 'react'
import './dialog.css'

export type DialogProps = {
    msgs?: string[]
    onClick?: () => void
    children?: JSX.Element
} & JSX.IntrinsicElements['div']

/**
 * 任意のメッセージを表示するダイアログ
 * @param props メッセージ、および実施するアクション
 * @param props.msgs メッセージの各行を格納した配列。各要素は別々の行として表示される
 * @param props.actionOnClick: ダイアログクリック時のアクション
 *
 * @constructor
 */
export function Dialog(props: DialogProps) {
    const { msgs = [],children, ..._props } = { ...props }
    return (
        <div className={'dialogContainer'}>
            <div className={'dialog'} {..._props}>
                {msgs.length > 0 && (
                    <div className={'caption'}>
                        {msgs.map((msg, index) => {
                            return <div key={index}>{msg}</div>
                        })}
                    </div>
                )}
                {children}
            </div>
        </div>
    )
}
