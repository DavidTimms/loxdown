import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "./helpers";
import LoxValue from "./LoxValue";

class LoxArray {
    readonly type = "ARRAY";
    static readonly loxClassName = "Array";
    readonly items: LoxValue[] = [];

    toString(): string {
        return `[${this.items.join(", ")}]`;
    }

    append(item: LoxValue): LoxArray {
        this.items.push(item);
        return this;
    }
}

interface LoxArray extends NativeTypeMixin {}
applyMixin(LoxArray, NativeTypeMixin);
export default LoxArray;
