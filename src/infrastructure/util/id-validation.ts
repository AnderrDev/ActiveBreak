// Converts a route parameter into an id. Only positive integers ("1", "42") are accepted;
// any other value ("1.5", "-3", "1e3", "abc", "") returns NaN so the controller answers 400.
export const parseId = (value: string | string[] | undefined): number => {
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
        return NaN;
    }
    const id = Number(value);
    return Number.isSafeInteger(id) ? id : NaN;
};
