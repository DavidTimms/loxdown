import { FullGenericParamMap, GenericParamMap } from "./GenericParamMap";
import Type from "./Type";

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
        const candidateCallable = candidate.callable;

        if (candidateCallable === null) return false;

        // Each *target* parameter type must be a subtype of the *candidate*
        // parameter type.
        const areParamsCompatible =
            candidateCallable.params.length === this.params.length &&
            candidateCallable.params.every(
                (candidateParam, i) => Type.unify(
                    candidateParam,
                    this.params[i],
                    generics,
                ));

        if (!areParamsCompatible) return false;

        // The *candidate* return type must be a subtype of the *target*
        // return type.
        const areReturnTypesCompatible =
            (
                candidateCallable.returns &&
                this.returns &&
                Type.unify(this.returns, candidateCallable.returns, generics)
            ) || (
                candidateCallable.returns === null &&
                this.returns === null
            );

        return areReturnTypesCompatible;
    }
}
