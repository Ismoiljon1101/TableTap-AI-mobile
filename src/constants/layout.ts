export const TABLE_UNIT_SIZE = 66;
export const CANVAS_PADDING = 10;

export const calculateTableDimensions = (capacity: number) => {
    // 1-2 people = 1x1 (Ratio 1)
    // 4 people = 1x1.5 (Ratio 1.5)
    // For every 2 people, add 0.5 to width ratio.
    // Formula: widthRatio = 1 + (Math.max(0, capacity - 2) / 2) * 0.5

    // Examples:
    // Cap 2: 1 + 0 = 1.0 -> 60x60
    // Cap 4: 1 + 0.5 = 1.5 -> 90x60
    // Cap 6: 1 + 1.0 = 2.0 -> 120x60
    // Cap 8: 1 + 1.5 = 2.5 -> 150x60

    // Ensure min capacity 2 for calc, though practically 1 person uses 2-person table usually.
    const effectiveCap = Math.max(2, capacity);
    const widthRatio = 1 + ((effectiveCap - 2) / 2) * 0.5;

    return {
        width: widthRatio * TABLE_UNIT_SIZE,
        height: TABLE_UNIT_SIZE
    };
};
