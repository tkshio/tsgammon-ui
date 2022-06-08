import './resignButton.css'

export function ResignButton(props: { onResign?: () => void }) {
    return (
        <div className='resignButton'
            onClick={() => {
                props.onResign?.()
            }}
        />
    )
}
