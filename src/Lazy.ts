export type Lazy<T> = T | (() => T);

export const Lazy = {
    /**
     * This is helper for defining properties on an object using a thunk
     * which will only be called once when the property is first accessed.
     */
    defineProperty<O, P extends keyof O>(
        object: O,
        property: P,
        value: Lazy<O[P]>,
    ): void {
        if (typeof value !== "function") {
            object[property] = value as O[P];
            return;
        }

        const thunk = value as () => O[P];

        Object.defineProperty(object, property, {
            configurable: true,
            enumerable: true,
            get(this: O) {
                const value = thunk();
                this[property] = value;
                return value;
            },
            set(this: O, value: O[P]): void {
                Object.defineProperty(object, property, {
                    configurable: true,
                    enumerable: true,
                    value,
                    writable: true,
                });
            },
        });
    },
};