export const level0: any = {
    "cars": [
        {
            "mx": 3,
            "my": 2,
            "line": 0
        },
        {
            "mx": 1,
            "my": 2,
            "line": 0
        },
        {
            "mx": 2,
            "my": 3,
            "line": 0
        },
        {
            "mx": 3,
            "my": 1,
            "line": 0
        },
        {
            "mx": 1,
            "my": 1,
            "line": 0
        }
    ],
    "house": [
        {
            "x": 263,
            "y": 108
        },
        {
            "x": 112,
            "y": 258
        }
    ],
    "house3": [
        {
            "x": 262,
            "y": 16
        }
    ],
    "bench": [
        {
            "x": 135,
            "y": 34
        }
    ],
    "tree": [
        {
            "x": 124,
            "y": 134
        },
        {
            "x": 7,
            "y": 11
        },
        {
            "x": 69,
            "y": 10
        },
        {
            "x": 19,
            "y": 238
        },
        {
            "x": 5,
            "y": 133
        },
        {
            "x": 260,
            "y": 211
        }
    ],
    "map": [
        [
            0,
            0,
            0,
            0,
            0
        ],
        [
            0,
            "↱",
            "↔",
            "↰",
            0
        ],
        [
            0,
            "↕",
            0,
            "↕",
            0
        ],
        [
            0,
            "↳",
            "↠",
            "↲",
            0
        ],
        [
            0,
            0,
            0,
            0,
            0
        ]
    ],
    "agent": {
        "mx": 2,
        "my": 1,
        "line": 1,
        "motion": {
            "type": "BasicMotionEngine",
            "options": {
                "rotationStep": 0.5,
                "actions": [
                    "UP",
                    "LEFT",
                    "RIGHT",
                    "DOWN",
                    "WAIT"
                ]
            }
        }
    }
}