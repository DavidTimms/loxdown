import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "../helpers";

class LoxString {
    readonly type = "STRING";
    static readonly loxClassName = "String";

    constructor(readonly value: string) {}

    toString(): string {
        return this.value;
    }
}

interface LoxString extends NativeTypeMixin {}
applyMixin(LoxString, NativeTypeMixin);
export default LoxString;
