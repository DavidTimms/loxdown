import Interpreter from "./Interpreter";
import LoxValue from "./LoxValue";
import LoxInstance from "./LoxInstance";

export interface LoxCallable {
    type: LoxValue["type"];
    arity(): number;
    bind(instance: LoxInstance): LoxCallable & LoxValue;
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
