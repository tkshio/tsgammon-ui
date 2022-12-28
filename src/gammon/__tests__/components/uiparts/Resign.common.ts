import { CubeState } from 'tsgammon-core'
import { ResignOffer } from 'tsgammon-core/ResignOffer'

export function alwaysAccept(_: ResignOffer, doAccept: () => void) {
    doAccept()
    return true
}
export function alwaysReject(
    _: ResignOffer,
    __: () => void,
    doReject: () => void
) {
    doReject()
    return true
}
export function alwaysOffer(resignOffer: ResignOffer) {
    return (
        doOffer: (offer: ResignOffer) => void,
        _: ResignOffer | undefined,
        __: CubeState
    ) => {
        doOffer(resignOffer)
    }
}
export function neverOffer() {
    return
}
