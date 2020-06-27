import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxValue from "./LoxValue";
import LoxInstance from "./LoxInstance";
import NativeTypeMixin from "./NativeTypeMixin";
import { applyMixin } from "./helpers";

class LoxClass implements LoxCallable {
    readonly type = "CLASS";

    constructor(
        readonly name: string,
        private readonly methods:
            Map<string, LoxCallable & LoxValue> = new Map(),
        readonly superclass: LoxClass | null = null,
    ) {}

    get loxClass(): LoxClass {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const globals = require("./globals");
        Object.defineProperty(LoxClass.prototype, "loxClass", {
            value: globals.Class,
        });
        return globals.Class;
    }

    arity(): number {
        return this.findMethod("init")?.arity() || 0;
    }

    bind(): LoxClass {
        return this;
    }

    call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
        const instance = new LoxInstance(this);
        return (
            this.findMethod("init")?.bind(instance).call(interpreter, args) ??
            instance
        );
    }

    findMethod(name: string): (LoxCallable & LoxValue) | undefined {
        return this.methods.get(name) ?? this.superclass?.findMethod(name);
    }

    toString(): string {
        return this.name;
    }
}

interface LoxClass extends NativeTypeMixin {}
applyMixin(LoxClass, NativeTypeMixin);

export default LoxClass;
