import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "./helpers";

// store instance here to ensure LoxNil is a singleton
let _nil: LoxNil | null = null;

class LoxNil {
    readonly type = "NIL";
    static readonly loxClassName = "Nil";

    constructor() {
        if (_nil) return _nil;
    }

    toString(): string {
        return "nil";
    }
}

interface LoxNil extends NativeTypeMixin {}
applyMixin(LoxNil, NativeTypeMixin);
export { LoxNil };


export const nil = _nil = new LoxNil();
