// Convierte un parámetro de ruta en id. Solo acepta enteros positivos ("1", "42");
// cualquier otro valor ("1.5", "-3", "1e3", "abc", "") devuelve NaN para que el
// controller responda 400 con su comprobación Number.isNaN habitual.
export const parseId = (value: string | string[] | undefined): number => {
    if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) {
        return NaN;
    }
    const id = Number(value);
    return Number.isSafeInteger(id) ? id : NaN;
};
