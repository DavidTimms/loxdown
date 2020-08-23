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
        const params = this.params.join(", ");
        return `fun (${params})` + (this.returns ? `: ${this.returns}` : "");
    }
}
