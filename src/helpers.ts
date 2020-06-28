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
