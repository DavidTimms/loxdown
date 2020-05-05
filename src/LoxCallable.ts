import Interpreter from "./Interpreter";
import LoxValue from "./LoxValue";
import NativeFunction from "./NativeFunction";
import LoxFunction from "./LoxFunction";

export interface LoxCallable {
    arity(): number;
    call(interpreter: Interpreter, args: LoxValue[]): LoxValue;
}
export default LoxCallable;

export function isLoxCallable(value: LoxValue): value is LoxCallable {
    return (
        value instanceof NativeFunction ||
        value instanceof LoxFunction
    );
}
