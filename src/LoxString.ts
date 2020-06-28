import LoxClass from "./LoxClass";
import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "./helpers";

class LoxString {
    readonly type = "STRING";

    constructor(readonly value: string) {}

    get loxClass(): LoxClass {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const globals = require("./globals");
        Object.defineProperty(LoxString.prototype, "loxClass", {
            value: globals.String,
        });
        return globals.String;
    }

    toString(): string {
        return this.value;
    }
}

interface LoxString extends NativeTypeMixin {}
applyMixin(LoxString, NativeTypeMixin);
export default LoxString;
