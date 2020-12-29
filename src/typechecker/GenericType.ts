import { zip } from "../helpers";
import ImplementationError from "../ImplementationError";
import ClassType from "./ClassType";
import { GenericParamMap, FullGenericParamMap } from "./GenericParamMap";
import GenericParamType from "./GenericParamType";
import Type from "./Type";

export default class GenericType<BodyType extends Type = Type> {
    readonly tag = "GENERIC";

    constructor(
        readonly params: GenericParamType[],
        readonly body: BodyType,
    ) {}

    get classType(): ClassType | null {
        return this.body.classType;
    }

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
        type: Type;
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

        const genericParamMap: FullGenericParamMap =
            new Map(zip(genericParams, genericArgs));

        const instantiatedType =
            this.body.instantiateGenerics(genericParamMap);

        return {errors, type: instantiatedType};
    }

    instantiateGenerics(generics: FullGenericParamMap): Type {
        return new GenericType(
            this.params,
            this.body.instantiateGenerics(generics),
        );
    }

    unify(candidate: Type, generics: GenericParamMap | null = null): boolean {
        // To test whether two generic type are compatible, we instantiate
        // one of them with the generic param types of the other. This
        // means the same type objects represent each type parameter in
        // both types, allowing a normal compatibility check to be used.
        if (
            candidate instanceof GenericType &&
                this.params.length === this.params.length
        ) {
            const instantiatedCandidate =
                    candidate.instantiate(this.params);

            if (instantiatedCandidate.errors.length > 0) {
                throw new ImplementationError(
                    "Errors while instantiating candidate for generic " +
                        "compatibility check. " +
                        instantiatedCandidate.errors.join(" "),
                );
            }
            return Type.unify(this.body, instantiatedCandidate.type, generics);
        }
        return false;
    }

    cloneParams(): GenericParamType[] {
        return this.params.map(({name}) => new GenericParamType(name));
    }
}
