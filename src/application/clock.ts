// Current date for the use cases. The domain rules receive it as a parameter
// so they stay pure (no clock inside the domain).

// Today's date (YYYY-MM-DD) in the server time zone (TZ, America/Bogota in Docker)
export const today = (): string => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${now.getFullYear()}-${month}-${day}`;
};
