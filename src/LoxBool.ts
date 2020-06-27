import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "./helpers";
import LoxClass from "./LoxClass";


class LoxBool {
    readonly type = "BOOL";
    private static readonly instances = new Map<boolean, LoxBool>();

    constructor(readonly isTrue: boolean = true) {
        const instance = LoxBool.instances.get(isTrue);
        if (instance) return instance;
        LoxBool.instances.set(isTrue, this);
    }

    get loxClass(): LoxClass {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const globals = require("./globals");
        Object.defineProperty(LoxBool.prototype, "loxClass", {
            value: globals.Boolean,
        });
        return globals.Boolean;
    }

    toString(): string {
        return String(this.isTrue);
    }
}

interface LoxBool extends NativeTypeMixin {}
applyMixin(LoxBool, NativeTypeMixin);
export { LoxBool };

export const loxTrue = new LoxBool(true);
export const loxFalse = new LoxBool(false);
