import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "../helpers";

class LoxNumber {
    readonly type = "NUMBER";
    static readonly loxClassName = "Number";

    constructor(readonly value: number) {}

    toString(): string {
        return String(this.value);
    }
}

interface LoxNumber extends NativeTypeMixin {}
applyMixin(LoxNumber, NativeTypeMixin);
export default LoxNumber;
