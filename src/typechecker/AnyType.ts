import { GenericParamMap } from "./GenericParamMap";
import Type from "./Type";

export default class AnyType {
    readonly tag = "ANY";
    readonly classType = null;

    get callable(): null {
        return null;
    }

    get(name: string): Type | null {
        return null;
    }

    toString(): string {
        return "Any";
    }

    instantiateGenerics(generics: GenericParamMap): Type {
        return this;
    }
}
