type Class<A = unknown> = new (...args: never[]) => A;

export function applyMixin(targetClass: Class, mixinClass: Class): void {
    Object.getOwnPropertyNames(mixinClass.prototype).forEach(name => {
        if (name === "constructor") return;
        const descriptor =
            Object.getOwnPropertyDescriptor(mixinClass.prototype, name);
        if (descriptor) {
            Object.defineProperty(targetClass.prototype, name, descriptor);
        }
    });
}

export function zip<L, R>(left: L[], right: R[]): [L, R][] {
    const length = Math.min(left.length, right.length);
    const zipped = [];
    for (let i = 0; i < length; i++) {
        const pair: [L, R] = [left[i], right[i]];
        zipped.push(pair);
    }
    return zipped;
}
