import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "./helpers";
import LoxValue from "./LoxValue";
import LoxNumber from "./LoxNumber";
import { nil } from "./LoxNil";

class LoxArray {
    readonly type = "ARRAY";
    static readonly loxClassName = "Array";

    constructor(
        readonly items: LoxValue[] = [],
    ) {}

    toString(): string {
        return `[${this.items.join(", ")}]`;
    }

    getItem(index: LoxValue): LoxValue {
        let itemsIndex = (index as LoxNumber).value;
        if (itemsIndex < 0) itemsIndex += this.items.length;
        return this.items[itemsIndex] ?? nil;
    }

    size(): LoxNumber {
        return new LoxNumber(this.items.length);
    }

    append(item: LoxValue): LoxArray {
        this.items.push(item);
        return this;
    }

    reverse(): LoxArray {
        this.items.reverse();
        return this;
    }

    clear(): LoxArray {
        this.items.length = 0;
        return this;
    }

    insertAt(index: LoxValue, value: LoxValue): LoxArray {
        this.items.splice((index as LoxNumber).value, 0, value);
        return this;
    }

    removeAt(index: LoxValue): LoxValue {
        return this.items.splice((index as LoxNumber).value, 1)[0];
    }
}

interface LoxArray extends NativeTypeMixin {}
applyMixin(LoxArray, NativeTypeMixin);
export default LoxArray;
