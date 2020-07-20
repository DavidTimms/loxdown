import Type from "./Type";

export default class CallableType {
    readonly tag = "CALLABLE";
    constructor(
        readonly params: Type[],
        readonly returns: Type | null,
    ) {}

    toString(): string {
        return `fun (${this.params.join(", ")}): ${this.returns}`;
    }
}
