import LoxClass from "./LoxClass";
import LoxInstance from "./LoxInstance";
import NativeFunction from "./NativeFunction";
import LoxValue from "./LoxValue";

const stringMethods = {
    init(value: LoxValue): LoxValue {
        return new LoxString(LoxString.loxClass, value.toString());
    },
};

export default class LoxString extends LoxInstance {
    readonly type = "STRING";
    static readonly loxClass = new LoxClass(
        "String",
        new Map(
            Object.entries(stringMethods)
                .map(([name, func]) => [name, new NativeFunction(func)]),
        ),
    );

    constructor(loxClass = LoxString.loxClass, readonly value: string) {
        super(loxClass);
    }

    toString(): string {
        return this.value;
    }
}
