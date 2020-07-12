import Type from "./Type";

export default class CallableType {
    constructor(
        readonly parameters: Type[],
        readonly returns: Type | null,
    ) {}

    toString(): string {
        return `fun (${this.parameters.join(", ")}): ${this.returns}`;
    }
}
