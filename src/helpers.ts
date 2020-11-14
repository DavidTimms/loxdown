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

enum ComparisonResult {
    Lower  = -1,
    Equal  =  0,
    Higher =  1,
}

type Comparator<Item> = (a: Item, b: Item) => ComparisonResult;

export function comparator<Item>(
    key: (item: Item) => (number | string | boolean)[],
): Comparator<Item> {
    return (a, b): ComparisonResult => {
        const aKey = key(a);
        const bKey = key(b);
        for (let i = 0; i < aKey.length; i++) {
            if (aKey[i] < bKey[0]) return ComparisonResult.Lower;
            if (aKey[i] > bKey[0]) return ComparisonResult.Higher;
        }
        return ComparisonResult.Equal;
    };
}

export function groupBy<Item, Key>(
    items: Item[],
    getKey: (item: Item) => Key,
): Map<Key, Item[]> {
    const grouped = new Map<Key, Item[]>();
    for (const item of items) {
        const key = getKey(item);
        const group = grouped.get(key) ?? [];
        group.push(item);
        grouped.set(key, group);
    }
    return grouped;
}
