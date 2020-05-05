import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxValue from "./LoxValue";
import {FunctionStmt} from "./Stmt";
import Environment from "./Environment";
import Return from "./Return";

export default class LoxFunction implements LoxCallable {
    constructor(
        private readonly declaration: FunctionStmt,
        private readonly closure: Environment,
    ) {
        this.declaration = declaration;
        this.closure = closure;
    }

    arity(): number {
        return this.declaration.params.length;
    }

    call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
        const environment = new Environment(this.closure);

        for (const [i, param] of this.declaration.params.entries()) {
            environment.define(param.lexeme, args[i]);
        }

        try {
            interpreter.executeBlock(this.declaration.body, environment);
        } catch (exception) {
            if (exception instanceof Return) {
                return exception.value;
            }
            throw exception;
        }
        return null;
    }

    toString(): string {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}
