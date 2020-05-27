import Interpreter from "./Interpreter";
import LoxCallable from "./LoxCallable";
import LoxValue from "./LoxValue";
import LoxInstance from "./LoxInstance";
import LoxFunction from "./LoxFunction";

export default class LoxClass implements LoxCallable {
    readonly type = "CLASS";
    constructor(
        readonly name: string,
        readonly superclass: LoxClass | null,
        private readonly methods: Map<string, LoxFunction>,
    ) {}

    arity(): number {
        return this.findMethod("init")?.arity() || 0;
    }

    call(interpreter: Interpreter, args: LoxValue[]): LoxValue {
        const instance = new LoxInstance(this);
        this.findMethod("init")?.bind(instance).call(interpreter, args);
        return instance;
    }

    findMethod(name: string): LoxFunction | undefined {
        return this.methods.get(name) ?? this.superclass?.findMethod(name);
    }

    toString(): string {
        return this.name;
    }
}
