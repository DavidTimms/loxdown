import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxValue from "./LoxValue";
import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "./helpers";


// Wraps a JavaScript/TypeScript function into a Lox callable
class NativeFunction implements LoxCallable {
    readonly type = "NATIVE_FUNCTION";
    static readonly loxClassName = "Function";

    constructor(
        private readonly jsFunction: (...args: LoxValue[]) => LoxValue,
    ) {}

    arity(): number {
        return this.jsFunction.length;
    }

    bind(instance: LoxValue): NativeFunction {
        return new NativeFunction(this.jsFunction.bind(instance));
    }

    call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
        return this.jsFunction(...args);
    }

    toString(): string {
        return "<native fn>";
    }
}

interface NativeFunction extends NativeTypeMixin {}
applyMixin(NativeFunction, NativeTypeMixin);
export default NativeFunction;
