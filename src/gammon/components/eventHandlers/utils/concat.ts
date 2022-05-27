export function concat0(
    a: (() => void) | undefined,
    b: (() => void) | undefined
): (() => void) | undefined {
    return a
        ? b
            ? () => {
                  a()
                  b()
              }
            : a
        : b
}

export function concat1<T>(
    a: ((arg: T) => void) | undefined,
    b: ((arg: T) => void) | undefined
): ((arg: T) => void) | undefined {
    return a
        ? b
            ? (arg: T) => {
                  a(arg)
                  b(arg)
              }
            : a
        : b
}
export function concat2<T1, T2>(
    a: ((arg1: T1, arg2: T2) => void) | undefined,
    b: ((arg1: T1, arg2: T2) => void) | undefined
): ((arg1: T1, arg2: T2) => void) | undefined {
    return a
        ? b
            ? (arg1: T1, arg2: T2) => {
                  a(arg1, arg2)
                  b(arg1, arg2)
              }
            : a
        : b
}
export function concat3<T1, T2, T3>(
    a: ((arg1: T1, arg2: T2, arg3: T3) => void) | undefined,
    b: ((arg1: T1, arg2: T2, arg3: T3) => void) | undefined
): ((arg1: T1, arg2: T2, arg3: T3) => void) | undefined {
    return a
        ? b
            ? (arg1: T1, arg2: T2, arg3: T3) => {
                  a(arg1, arg2, arg3)
                  b(arg1, arg2, arg3)
              }
            : a
        : b
}
