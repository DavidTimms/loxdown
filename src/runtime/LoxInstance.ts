import LoxClass from "./LoxClass";
import LoxValue from "./LoxValue";
import Token from "../ast/Token";
import RuntimeError from "./RuntimeError";

export default class LoxInstance {
    readonly type = "INSTANCE";
    static readonly loxClass: LoxClass | null = null;
    private readonly fields = new Map<string, LoxValue>();
    constructor(readonly loxClass: LoxClass) {}

    toString(): string {
        return `${this.loxClass.name} instance`;
    }

    get(name: Token): LoxValue {
        const value = this.fields.get(name.lexeme);

        if (value !== undefined) return value;

        const method = this.loxClass.findMethod(name.lexeme);
        if (method !== undefined) return method.bind(this);

        throw new RuntimeError(
            `Undefined property '${name.lexeme}'.`, name);
    }

    set(name: Token, value: LoxValue): void {
        this.fields.set(name.lexeme, value);
    }
}
