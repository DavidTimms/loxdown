import GenericParamType from "./GenericParamType";
import Type from "./Type";
// import { default as types } from "./builtinTypes";

export type CallableNarrowingProducer = (argTypes: Type[]) => Map<number, Type>;

export default class CallableType {
    readonly tag = "CALLABLE";
    readonly classType = null;

    constructor(
        readonly genericParams: GenericParamType[],
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

    // instantiateGenerics(genericArgs: Type[]): {
    //     errors: string[];
    //     type: CallableType;
    // } {
    //     const genericParams = this.genericParams;
    //     const errors = [];

    //     if (genericArgs.length > genericParams.length) {
    //         errors.push(
    //             "Too many generic type arguments provided. " +
    //             `Expected ${genericParams.length}, ` +
    //             `but received ${genericArgs.length}.`,
    //         );
    //         genericArgs.length = genericParams.length;
    //     }

    //     if (genericParams.length > 0) {
    //         if (genericArgs.length < genericParams.length) {
    //             errors.push(
    //                 "Not enough generic type arguments provided. " +
    //                 `Expected ${genericParams.length}, ` +
    //                 `but received ${genericArgs.length}.`,
    //             );
    //             // pad the arguments to the required length with error types
    //             const argsLength = genericArgs.length;
    //             genericArgs.length = genericParams.length;
    //             genericArgs.fill(types.PreviousTypeError, argsLength);
    //         }
    //     } else {
    //         return {errors, type: this};
    //     }

    //     return {errors, type: this};
    // }

    // populateGenerics(genericArgs: Type[]): CallableType {
    //     // TODO
    //     return this;
    // }
}
