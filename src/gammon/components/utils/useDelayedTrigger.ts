import { useEffect, useState } from 'react'

export function useDelayedTrigger(
    trigger: () => boolean,
    delayms: number
): void {
    // 初期状態は待機状態
    const [flag, setFlag] = useState<boolean>(false)
    const [isWaiting, setIsWaiting] = useState<boolean>(true)

    // setTimeoutのCleanup用の情報を保持する
    const [cleanup, setCleanup] = useState<ReturnType<typeof setTimeout>>()
    useEffect(() => {
        // このuseEffectは普段は何もせず、
        // unmount時にのみクリーンナップを行う
        return () => {
            if (cleanup) {
                clearTimeout(cleanup)
            }
        }
    }, [cleanup])

    // 待機状態ならば、フラグを指定された時間後に上げる
    // 上げている最中は非待機状態となり、何もしない
    useEffect(() => {
        if (isWaiting) {
            setIsWaiting(false)
            const ts = setTimeout(() => {
                setFlag(true)
            }, delayms)
            // ここで単純にクリーンナップ関数を返すと、
            // isWaitngが依存対象に含まれるので即座に
            // クリーンナップされてしまう
            setCleanup(ts)
        }
    }, [isWaiting, delayms])

    // フラグが上がったら、指定されたトリガーを実行する
    // トリガーが成功すれば、待機状態に戻り、delaymsの間は次のトリガーの実行は保留される

    // 状態の変化によりtriggerが更新されても、フラグが解除されるまで（不能期）は
    // 実質的にuseEffectの効果を発生させない効果がある
    // これにより、自律的な状態の書き換えはdelayms間ごとにしか起こらない
    // (repeatと異なり、何も状態に変化がないときは何の処理も発生しない)
    useEffect(() => {
        if (flag) {
            if (trigger()) {
                setFlag(false)
                setIsWaiting(true)
            }
        }
    }, [flag, trigger])
}
