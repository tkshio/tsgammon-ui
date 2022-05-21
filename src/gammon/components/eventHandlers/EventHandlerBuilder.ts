export type EventHandlerBuilder<H, L> = (addOn: EventHandlerAddOn<H, L>) => {
    handlers: H
}
export type EventHandlerAddOn<H, L> = {
    eventHandlers: Partial<H>
    listeners: Partial<L>
}

export function wrap<H, L>(
    base: EventHandlerBuilder<H, L>,
    decorateH: (h1: Partial<H>, h2: Partial<H>) => Partial<H>,
    decorateL: (h1: Partial<L>, h2: Partial<L>) => Partial<L>,
    addOn?: EventHandlerAddOn<H, L>
): WrappedBuilder<H, L> {
    const builder = addOn
        ? concatAddOns(base, addOn, decorateH, decorateL)
        : base
    return {
        builder,
        addOn: (newAddOn: EventHandlerAddOn<H, L>) =>
            wrap(builder, decorateH, decorateL, newAddOn),
        build: (setStateListener: L) =>
            builder({ eventHandlers: {}, listeners: setStateListener }),
    }
}

type WrappedBuilder<H, L> = {
    builder: EventHandlerBuilder<H, L>
    addOn: (n: EventHandlerAddOn<H, L>) => WrappedBuilder<H, L>
    build: (setStateListener: L) => { handlers: H; }
}

function concatAddOns<H, L>(
    builder: EventHandlerBuilder<H, L>,
    h: EventHandlerAddOn<H, L>,
    decorateH: (h1: Partial<H>, h2: Partial<H>) => Partial<H>,
    decorateL: (h1: Partial<L>, h2: Partial<L>) => Partial<L>
): EventHandlerBuilder<H, L> {
    return (addOn: EventHandlerAddOn<H, L>) => {
        const { eventHandlers, listeners } = addOn
        return builder({
            eventHandlers: decorateH(h.eventHandlers, eventHandlers),
            listeners: decorateL(h.listeners, listeners),
        })
    }
}