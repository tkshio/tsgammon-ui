import { CubeOwner } from 'tsgammon-core/CubeState';
import { CubeProps } from '../Cube';


export function layoutCube(cube?: CubeProps): {
    centerCube?: CubeProps;
    redCube?: CubeProps;
    whiteCube?: CubeProps;
} {
    const cubeOwner = cube?.cube?.owner;
    const [centerCube, redCube, whiteCube] = doLayout();

    return { centerCube, redCube, whiteCube };

    function doLayout() {
        if (cubeOwner === undefined) {
            return [cube, undefined, undefined];
        }
        switch (cubeOwner) {
            case CubeOwner.WHITE:
                return [undefined, undefined, cube];
            case CubeOwner.RED:
                return [undefined, cube, undefined];
        }
    }
}
