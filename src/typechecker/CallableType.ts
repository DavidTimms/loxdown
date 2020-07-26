import Type from "./Type";

export default class CallableType {
    readonly tag = "CALLABLE";
    readonly classType = null;

    constructor(
        readonly params: Type[],
        readonly returns: Type | null = null,
    ) {}

    get callable(): CallableType {
        return this;
    }

    toString(): string {
        return `fun (${this.params.join(", ")}): ${this.returns}`;
    }
}
