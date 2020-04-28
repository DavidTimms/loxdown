import LoxValue from "./LoxValue";
import Token from "./Token";
import RuntimeError from "./RuntimeError";

export default class Environment {
    private readonly values = new Map<string, LoxValue>();

    get(name: Token): LoxValue {
        const value = this.values.get(name.lexeme);

        if (value === undefined) {
            throw new RuntimeError(
                name, `Undefined variable '${name.lexeme}'.`);
        }

        return value;
    }

    define(name: string, value: LoxValue): void {
        this.values.set(name, value);
    }
}