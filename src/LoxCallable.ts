import Interpreter from "./Interpreter";
import LoxValue from "./LoxValue";

export interface LoxCallable {
    type: LoxValue["type"];
    arity(): number;
    call(interpreter: Interpreter, args: LoxValue[]): LoxValue;
}
export default LoxCallable;

export function isLoxCallable(value: LoxValue): value is LoxCallable & LoxValue {
    return (
        value.type === "FUNCTION" ||
        value.type === "NATIVE_FUNCTION" ||
        value.type === "CLASS"
    );
}
