import LoxClass from "./LoxClass";
import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "./helpers";

class LoxNumber {
    readonly type = "NUMBER";
    constructor(readonly value: number) {}

    get loxClass(): LoxClass {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const globals = require("./globals");
        Object.defineProperty(LoxNumber.prototype, "loxClass", {
            value: globals.Number,
        });
        return globals.Number;
    }

    toString(): string {
        return String(this.value);
    }
}

interface LoxNumber extends NativeTypeMixin {}
applyMixin(LoxNumber, NativeTypeMixin);
export default LoxNumber;
