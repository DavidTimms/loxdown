import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "./helpers";
import LoxClass from "./LoxClass";

// store instance here to ensure LoxNil is a singleton
let _nil: LoxNil | null = null;

class LoxNil {
    readonly type = "NIL";

    constructor() {
        if (_nil) return _nil;
    }

    get loxClass(): LoxClass {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const globals = require("./globals");
        Object.defineProperty(LoxNil.prototype, "loxClass", {
            value: globals.Nil,
        });
        return globals.Nil;
    }

    toString(): string {
        return "nil";
    }
}

interface LoxNil extends NativeTypeMixin {}
applyMixin(LoxNil, NativeTypeMixin);
export { LoxNil };


export const nil = _nil = new LoxNil();
