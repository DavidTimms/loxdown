import { zip } from "../helpers";
import { GenericParamMap } from "./GenericParamMap";
import GenericParamType from "./GenericParamType";
import Type from "./Type";

export default class GenericType<BodyType extends Type = Type> {
    readonly tag = "GENERIC";
    readonly classType = null;

    constructor(
        readonly params: GenericParamType[],
        readonly body: BodyType,
    ) {}

    get callable(): null {
        return null;
    }

    get(name: string): Type | null {
        return null;
    }

    toString(): string {
        return this.body.toString();
    }

    static wrap<BodyType extends Type = Type>(
        genericParams: GenericParamType[],
        body: BodyType,
    ): BodyType | GenericType<BodyType> {
        if (genericParams.length > 0) {
            return new GenericType(genericParams, body);
        } else {
            return body;
        }
    }

    static unwrap<BodyType extends Type = Type>(
        type: BodyType | GenericType<BodyType>,
    ): BodyType {
        if (type instanceof GenericType) {
            return type.body;
        } else {
            return type;
        }
    }

    instantiate(genericArgs: Type[]): {
        errors: string[];
        type: BodyType;
    } {
        const genericParams = this.params;
        const errors = [];

        if (genericArgs.length > genericParams.length) {
            errors.push(
                "Too many generic type arguments provided. " +
                `Expected ${genericParams.length}, ` +
                `but received ${genericArgs.length}.`,
            );
            genericArgs.length = genericParams.length;
        }

        if (genericArgs.length < genericParams.length) {
            errors.push(
                "Not enough generic type arguments provided. " +
                `Expected ${genericParams.length}, ` +
                `but received ${genericArgs.length}.`,
            );
            // pad the arguments to the required length with error types.
            const argsLength = genericArgs.length;
            genericArgs.length = genericParams.length;

            // TODO sort out import orders so this can be done with a
            // standard module import instead of require.
            const types = require("./builtinTypes").default;
            genericArgs.fill(types.PreviousTypeError, argsLength);
        }

        const genericParamMap: GenericParamMap =
            new Map(zip(genericParams, genericArgs));

        const instantiatedType =
            this.body.instantiateGenerics(genericParamMap);

        return {errors, type: instantiatedType};
    }

    instantiateGenerics(generics: GenericParamMap): Type {
        return new GenericType(
            this.params,
            this.body.instantiateGenerics(generics),
        );
    }
}
