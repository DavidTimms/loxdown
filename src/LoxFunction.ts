import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxValue from "./LoxValue";
import {FunctionStmt} from "./Stmt";
import Environment from "./Environment";
import Return from "./Return";
import LoxInstance from "./LoxInstance";
import { nil } from "./LoxNil";

export default class LoxFunction implements LoxCallable {
    constructor(
        private readonly declaration: FunctionStmt,
        private readonly closure: Environment,
        private readonly isInitializer: boolean = false,
    ) {}

    arity(): number {
        return this.declaration.params.length;
    }

    bind(instance: LoxInstance): LoxFunction {
        const environment = new Environment(this.closure);
        environment.define("this", instance);
        return new LoxFunction(
            this.declaration,
            environment,
            this.isInitializer,
        );
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
                if (this.isInitializer) return this.closure.getAt(0, "this");
                return exception.value;
            }
            throw exception;
        }

        if (this.isInitializer) return this.closure.getAt(0, "this");
        return nil;
    }

    toString(): string {
        return `<fn ${this.declaration.name.lexeme}>`;
    }
}
