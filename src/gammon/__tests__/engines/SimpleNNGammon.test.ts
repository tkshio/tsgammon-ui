import {evalWithNN} from "../../engines/SimpleNNGammon";

test('eval', () => {
    const points = [0,
        2, 0, 0, 0, 0, -5,/* bar */ 0, -3, 0, 0, 0, 5,
        -5, 0, 0, 0, 3, 0, /* bar */5, 0, 0, 0, 0, -2,
        0
    ]
    const n = evalWithNN(points, 0, 0);
    // 呼び出して何か値が返ってくればよしとする
    expect(n.length).toBe(4)
    console.log(n[0], n[1], n[2], n[3])
    //参考： red 49.697 15.548 / white 50.303 13.057 -0.018855
})

test('eval midst of game', () => {
    const points = [0,
        0, 0, 0, 0, 0, -5,/* bar */ 0, -3, 0, 0, 0, -2,
        -5, 0, 0, 0, 0, 0, /* bar */0, 0, 0, 0, 0, 1,
        0
    ]
    const n = evalWithNN(points, 14, 0);
    expect(n.length).toBe(4)
    console.log(n[0], n[1], n[2], n[3])
    // ギャモンっぽい値になるのがよい
})