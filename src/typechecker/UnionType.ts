import Type from "./Type";

export default class UnionType {
    readonly tag = "UNION";
    readonly classType = null;

    constructor(
        readonly children: Type[],
    ) {}

    get callable(): null {
        // TODO
        return null;
    }

    get(name: string): Type | null {
        // TODO
        return null;
    }

    toString(): string {
        return this.children.join(" | ");
    }
}
