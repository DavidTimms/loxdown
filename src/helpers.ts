type Class<A = unknown> = new (...args: any[]) => A;

export function applyMixin(targetClass: Class, mixinClass: Class): void {
    Object.getOwnPropertyNames(mixinClass.prototype).forEach(name => {
        const descriptor =
            Object.getOwnPropertyDescriptor(mixinClass.prototype, name);
        if (descriptor) {
            Object.defineProperty(targetClass.prototype, name, descriptor);
        }
    });
}
