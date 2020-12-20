import { FullGenericParamMap, GenericParamMap } from "./GenericParamMap";
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

    instantiateGenerics(generics: FullGenericParamMap): Type {
        return this;
    }

    unify(candidate: Type, generics: GenericParamMap | null = null): boolean {
        return true;
    }
}
