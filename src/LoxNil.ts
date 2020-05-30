import LoxClass from "./LoxClass";
import LoxInstance from "./LoxInstance";
import NativeFunction from "./NativeFunction";
import LoxValue from "./LoxValue";

// store instance here to ensure LoxNil is a singleton
let _nil: LoxNil | null = null;

const nilMethods = {
    init(): LoxValue {
        return new LoxNil();
    },
};

export class LoxNil extends LoxInstance {
    static readonly loxClass = new LoxClass(
        "Nil",
        new Map(
            Object.entries(nilMethods)
                .map(([name, func]) => [name, new NativeFunction(func)]),
        ),
    );
    readonly type = "NIL";

    constructor(loxClass = LoxNil.loxClass) {
        super(loxClass);
        if (_nil) return _nil;
    }

    toString(): string {
        return "nil";
    }
}

export const nil = _nil = new LoxNil();
