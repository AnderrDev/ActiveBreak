/*
Serializes operations that share the same key inside this Node process.

Business rules such as "at most 3 active reminders" are checked by reading and then writing.
Without this lock, two simultaneous requests (a double click) could both pass the check.
Limitation: it only works within a single API instance (like the in-memory rate limit).
*/
export class KeyedLock {
    private tails = new Map<string, Promise<unknown>>();

    async run<T>(key: string, task: () => Promise<T>): Promise<T> {
        const previous = this.tails.get(key) ?? Promise.resolve();
        // The next task waits for the previous one, whether it succeeded or failed
        const current = previous.catch(() => undefined).then(task);
        this.tails.set(key, current);
        try {
            return await current;
        } finally {
            // Free the key when no one else queued behind this task
            if (this.tails.get(key) === current) {
                this.tails.delete(key);
            }
        }
    }
}

// Single shared instance so every service locks against the same keys
export const appLock = new KeyedLock();
