import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxValue from "./LoxValue";
import LoxInstance from "./LoxInstance";

export default class LoxClass implements LoxCallable {
    constructor(
        readonly name: string,
    ) {
        this.name = name;
    }

    arity(): number {
        return 0;
    }

    call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
        const instance = new LoxInstance(this);
        return instance;
    }

    toString(): string {
        return this.name;
    }
}
