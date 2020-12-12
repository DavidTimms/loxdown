import { GenericParamMap } from "./GenericParamMap";
import GenericParamType from "./GenericParamType";
import Type from "./Type";
// import { default as types } from "./builtinTypes";

export type CallableNarrowingProducer = (argTypes: Type[]) => Map<number, Type>;

export default class CallableType {
    readonly tag = "CALLABLE";
    readonly classType = null;

    constructor(
        readonly genericParams: GenericParamType[], // TODO remove this property
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

    instantiateGenerics(generics: GenericParamMap): Type {
        const params =
            this.params.map(param => param.instantiateGenerics(generics));
        const returns =
            this.returns && this.returns.instantiateGenerics(generics);

        return new CallableType(
            this.genericParams,
            params,
            returns,
            this.produceNarrowings,
        );
    }
}
