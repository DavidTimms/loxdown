import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "./helpers";

class LoxBool {
    readonly type = "BOOL";
    static readonly loxClassName = "Boolean";
    private static readonly instances = new Map<boolean, LoxBool>();

    constructor(readonly isTrue: boolean = true) {
        const instance = LoxBool.instances.get(isTrue);
        if (instance) return instance;
        LoxBool.instances.set(isTrue, this);
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
