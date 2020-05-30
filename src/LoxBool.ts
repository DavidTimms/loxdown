import LoxClass from "./LoxClass";
import LoxInstance from "./LoxInstance";
import NativeFunction from "./NativeFunction";
import LoxValue from "./LoxValue";
import { isTruthy } from "./coreSemantics";

const boolMethods = {
    init(value: LoxValue): LoxValue {
        return isTruthy(value) ? loxTrue : loxFalse;
    },
};

export class LoxBool extends LoxInstance {
    readonly type = "BOOL";
    private static readonly instances = new Map<boolean, LoxBool>();
    static readonly loxClass = new LoxClass(
        "Boolean",
        new Map(
            Object.entries(boolMethods)
                .map(([name, func]) => [name, new NativeFunction(func)]),
        ),
    );

    constructor(loxClass = LoxBool.loxClass, readonly isTrue: boolean = true) {
        super(loxClass);
        const instance = LoxBool.instances.get(isTrue);
        if (instance) return instance;
        LoxBool.instances.set(isTrue, this);
    }

    toString(): string {
        return String(this.isTrue);
    }
}

export const loxTrue = new LoxBool(LoxBool.loxClass, true);
export const loxFalse = new LoxBool(LoxBool.loxClass, false);
