import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxValue from "./LoxValue";

// Wraps a JavaScript/TypeScript function into a Lox callable
export default class NativeFunction implements LoxCallable {
    readonly type = "NATIVE_FUNCTION";
    constructor(
        private readonly jsFunction: (...args: LoxValue[]) => LoxValue,
    ) {
        this.jsFunction = jsFunction;
    }

    arity(): number {
        return this.jsFunction.length;
    }

    call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
        return this.jsFunction(...args);
    }

    toString(): string {
        return "<native fn>";
    }
}
