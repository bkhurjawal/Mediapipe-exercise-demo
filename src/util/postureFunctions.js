export const frontView = (
    landmarks,
    canvasSize,
) => {
    const vectorAngle = (x, y) => {
        return Math.acos(
            x.reduce((acc, n, i) => acc + n * y[i], 0) /
                (Math.hypot(...x) * Math.hypot(...y)),
        );
    };

    const invertSignal = (num, condition) =>
        condition ? -num : num;

    const getHorizontalAngle = (A, B) => {
        const C = { x: B.x, y: A.y };
        const AB = { x: B.x - A.x, y: B.y - A.y };
        const CA = { x: C.x - A.x, y: C.y - A.y };

        const angle =
            vectorAngle(
                [AB.x * canvasSize.width, AB.y * canvasSize.height],
                [CA.x * canvasSize.width, CA.y * canvasSize.height],
            ) *
            (180 / Math.PI);

        return Math.trunc(invertSignal(angle, B.y > A.y));
    };

    const getVerticalAngle = (
        A,
        B,
        C,
    ) => {
        const newA = {
            ...A,
            x: (A.x + B.x) / 2,
            y: (A.y + B.y) / 2,
        };
        const newB = {
            ...B,
            x: (A.x + B.x) / 2,
            y: 0,
        };

        const AB = { x: newB.x - newA.x, y: newB.y - newA.y };
        const CA = { x: C.x - newA.x, y: C.y - newA.y };

        const angle =
            vectorAngle(
                [AB.x * canvasSize.width, AB.y * canvasSize.height],
                [CA.x * canvasSize.width, CA.y * canvasSize.height],
            ) *
            (180 / Math.PI);

        return Math.trunc(invertSignal(angle, newB.y > newA.y));
    };

    return {
        head: getVerticalAngle(landmarks[12], landmarks[11], landmarks[0]),
        ear: getHorizontalAngle(landmarks[8], landmarks[7]),
        shoulder: getHorizontalAngle(landmarks[12], landmarks[11]),
        elbow: getHorizontalAngle(landmarks[14], landmarks[13]),
        hip: getHorizontalAngle(landmarks[24], landmarks[23]),
        knee: getHorizontalAngle(landmarks[26], landmarks[25]),
        ankle: getHorizontalAngle(landmarks[28], landmarks[27]),
    };
};


export const backView = (
    landmarks,
    canvasSize,
) => {
    const vectorAngle = (x, y) => {
        return Math.acos(
            x.reduce((acc, n, i) => acc + n * y[i], 0) /
                (Math.hypot(...x) * Math.hypot(...y)),
        );
    };

    const invertSignal = (num, condition) =>
        condition ? -num : num;

    const getHorizontalAngle = (A, B) => {
        const C = { x: B.x, y: A.y };
        const AB = { x: B.x - A.x, y: B.y - A.y };
        const CA = { x: C.x - A.x, y: C.y - A.y };

        const angle =
            vectorAngle(
                [AB.x * canvasSize.width, AB.y * canvasSize.height],
                [CA.x * canvasSize.width, CA.y * canvasSize.height],
            ) *
            (180 / Math.PI);

        return Math.trunc(invertSignal(angle, B.y > A.y));
    };

    const getVerticalAngle = (
        A,
        B,
        C,
    ) => {
        const newA = {
            ...A,
            x: (A.x + B.x) / 2,
            y: (A.y + B.y) / 2,
        };
        const newB = {
            ...B,
            x: (A.x + B.x) / 2,
            y: 0,
        };

        const AB = { x: newB.x - newA.x, y: newB.y - newA.y };
        const CA = { x: C.x - newA.x, y: C.y - newA.y };

        const angle =
            vectorAngle(
                [AB.x * canvasSize.width, AB.y * canvasSize.height],
                [CA.x * canvasSize.width, CA.y * canvasSize.height],
            ) *
            (180 / Math.PI);

        return Math.trunc(invertSignal(angle, newB.y > newA.y));
    };

    return {
        head: getVerticalAngle(landmarks[12], landmarks[11], landmarks[0]),
        ear: getHorizontalAngle(landmarks[8], landmarks[7]),
        shoulder: getHorizontalAngle(landmarks[12], landmarks[11]),
        elbow: getHorizontalAngle(landmarks[14], landmarks[13]),
        hip: getHorizontalAngle(landmarks[24], landmarks[23]),
        knee: getHorizontalAngle(landmarks[26], landmarks[25]),
        ankle: getHorizontalAngle(landmarks[28], landmarks[27]),
    };
};

export const leftView = (
    landmarks,
    canvasSize,
) => {
    const vectorAngle = (x, y) => {
        return Math.acos(
            x.reduce((acc, n, i) => acc + n * y[i], 0) /
                (Math.hypot(...x) * Math.hypot(...y)),
        );
    };

    const getVerticalAngleLeftRight = (
        A,
        B,
        lineBase,
    ) => {
        const C = { x: lineBase.x, y: A.y };
        const D = { x: lineBase.x, y: B.y };

        const AD = { x: D.x - A.x, y: D.y - A.y };
        const DC = { x: C.x - D.x, y: C.y - D.y };

        const angle =
            vectorAngle(
                [AD.x * canvasSize.width, AD.y * canvasSize.height],
                [DC.x * canvasSize.width, DC.y * canvasSize.height],
            ) *
            (180 / Math.PI);

        return Math.trunc(A.x < C.x ? angle - 180 : 180 - angle);
    };

    return {
        ear: getVerticalAngleLeftRight(landmarks[7], landmarks[11], landmarks[27]),
        shoulder: getVerticalAngleLeftRight(landmarks[11], landmarks[13], landmarks[27]),
        elbow: getVerticalAngleLeftRight(landmarks[13], landmarks[23], landmarks[27]),
        hip: getVerticalAngleLeftRight(landmarks[23], landmarks[25], landmarks[27]),
        knee: getVerticalAngleLeftRight(landmarks[25], landmarks[27], landmarks[27]),
    };
};

export const rightView = (
    landmarks,
    canvasSize,
) => {
    const vectorAngle = (x, y) => {
        return Math.acos(
            x.reduce((acc, n, i) => acc + n * y[i], 0) /
                (Math.hypot(...x) * Math.hypot(...y)),
        );
    };

    const getVerticalAngleLeftRight = (
        A,
        B,
        lineBase,
    ) => {
        const C = { x: lineBase.x, y: A.y };
        const D = { x: lineBase.x, y: B.y };

        const AD = { x: D.x - A.x, y: D.y - A.y };
        const DC = { x: C.x - D.x, y: C.y - D.y };

        const angle =
            vectorAngle(
                [AD.x * canvasSize.width, AD.y * canvasSize.height],
                [DC.x * canvasSize.width, DC.y * canvasSize.height],
            ) *
            (180 / Math.PI);

        return Math.trunc(A.x < C.x ? angle - 180 : 180 - angle);
    };

    return {
        ear: getVerticalAngleLeftRight(landmarks[8], landmarks[12], landmarks[28]),
        shoulder: getVerticalAngleLeftRight(landmarks[12], landmarks[14], landmarks[28]),
        elbow: getVerticalAngleLeftRight(landmarks[14], landmarks[24], landmarks[28]),
        hip: getVerticalAngleLeftRight(landmarks[24], landmarks[26], landmarks[28]),
        knee: getVerticalAngleLeftRight(landmarks[26], landmarks[28], landmarks[28]),
    };
};
