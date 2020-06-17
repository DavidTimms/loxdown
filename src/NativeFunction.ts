import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxValue from "./LoxValue";
import LoxInstance from "./LoxInstance";
import LoxClass from "./LoxClass";


// Wraps a JavaScript/TypeScript function into a Lox callable
export default class NativeFunction implements LoxCallable {
    readonly type = "NATIVE_FUNCTION";

    constructor(
        private readonly jsFunction: (...args: LoxValue[]) => LoxValue,
    ) {}

    // Uses a getter to defer initialisation of the property
    // until it is accessed. This avoids the circular dependency
    // between NativeFunction and the global Function class.
    get loxClass(): LoxClass {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const globals = require("./globals");
        Object.defineProperty(NativeFunction.prototype, "loxClass", {
            value: globals.Function,
        });
        return globals.Function;
    }

    arity(): number {
        return this.jsFunction.length;
    }

    bind(instance: LoxInstance): NativeFunction {
        return new NativeFunction(this.jsFunction.bind(instance));
    }

    call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
        return this.jsFunction(...args);
    }

    toString(): string {
        return "<native fn>";
    }
}
