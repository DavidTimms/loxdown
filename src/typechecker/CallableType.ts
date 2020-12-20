import { FullGenericParamMap, GenericParamMap } from "./GenericParamMap";
import Type, { isCallableCompatible } from "./Type";

export type CallableNarrowingProducer = (argTypes: Type[]) => Map<number, Type>;

export default class CallableType {
    readonly tag = "CALLABLE";
    readonly classType = null;

    constructor(
        readonly params: Type[],
        readonly returns: Type | null = null,
        readonly produceNarrowings: CallableNarrowingProducer | null = null,
    ) {}

    get callable(): CallableType {
        return this;
    }

    get(name: string): Type | null {
        return null;
    }

    toString(): string {
        const params = this.params.join(", ");
        return `fun (${params})` + (this.returns ? `: ${this.returns}` : "");
    }

    instantiateGenerics(generics: FullGenericParamMap): Type {
        const params =
            this.params.map(param => param.instantiateGenerics(generics));
        const returns =
            this.returns && this.returns.instantiateGenerics(generics);

        return new CallableType(
            params,
            returns,
            this.produceNarrowings,
        );
    }

    unify(candidate: Type, generics: GenericParamMap | null = null): boolean {
        const callable = candidate.callable;

        // TODO replace isCallableCompatible with a function which does unification
        return callable !== null && isCallableCompatible(callable, this);
    }
}

