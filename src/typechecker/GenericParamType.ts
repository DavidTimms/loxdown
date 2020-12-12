
import Type from "./Type";

export default class GenericParamType {
    readonly tag = "GENERIC_PARAM";
    readonly classType = null;

    constructor(
        readonly name: string,
    ) {}

    get callable(): null {
        return null;
    }

    get(name: string): Type | null {
        return null;
    }

    toString(): string {
        return this.name;
    }
}
