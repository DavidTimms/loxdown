
import { FullGenericParamMap, GenericParamMap } from "./GenericParamMap";
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

    instantiateGenerics(generics: FullGenericParamMap): Type {
        return generics.get(this) ?? this;
    }

    unify(candidate: Type, generics: GenericParamMap | null = null): boolean {
        const boundType = generics?.get(this);
        if (boundType) {
            // If a type is bound to itself, that means it is a recursive call,
            // so we must return here to avoid an infinite loop.
            if (boundType === this) {
                return true;
            }
            // The parameter is being inferred, and has already been bound
            // to type, so we attempt to unify that bound type with the
            // candidate.
            return Type.unify(boundType, candidate, generics);

        } else if (boundType === null) {
            // The parameter is being inferred, but has not yet been bound
            // to a type, so we bind it to the candidate type here.
            generics?.set(this, candidate);
            return true;
        }
        // The parameter is not being inferred, so we do not know what type
        // it will be instantiated with, so we conservatively only let it be
        // unified with itself.
        return this === candidate;
    }
}
