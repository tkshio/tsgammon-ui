export enum CubeOwner { WHITE = 1, RED }

export type CubeValue = 1 | 2 | 4 | 8 | 16 | 32 | 64 | 128 | 256 | 512
export type CubeState = {
    value: CubeValue
    owner?: CubeOwner
    isMax(): boolean
    double(side: CubeOwner): CubeState
    doubledValue(): number;
};


export function cube(value: CubeValue, owner?: CubeOwner, max: CubeValue = 512): CubeState {
    return {
        value: value,
        owner: owner,
        isMax(): boolean {
            return (max <= this.value) || 512 <= value
        },
        double(newOwner: CubeOwner): CubeState {
            return this.isMax() ? this :
                {
                    ...this,
                    value: this.value * 2 as CubeValue,
                    owner: newOwner
                }
        },
        doubledValue() {
            return this.isMax() ? this.value : this.value * 2 as CubeValue
        }
    };
}
