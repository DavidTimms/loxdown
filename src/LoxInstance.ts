import LoxClass from "./LoxClass";
import LoxValue from "./LoxValue";
import Token from "./Token";
import RuntimeError from "./RuntimeError";

type LoxInstanceType = "INSTANCE" | "NIL";

export default class LoxInstance {
    readonly type: LoxInstanceType = "INSTANCE";
    private readonly fields = new Map<string, LoxValue>();
    constructor(readonly loxClass: LoxClass) {
        this.loxClass = loxClass;
    }

    toString(): string {
        return `${this.loxClass.name} instance`;
    }

    get(name: Token): LoxValue {
        const value = this.fields.get(name.lexeme);

        if (value !== undefined) return value;

        const method = this.loxClass.findMethod(name.lexeme);
        if (method !== undefined) return method.bind(this);

        throw new RuntimeError(
            name, `Undefined property '${name.lexeme}'.`);
    }

    set(name: Token, value: LoxValue): void {
        this.fields.set(name.lexeme, value);
    }
}
