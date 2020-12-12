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
}
