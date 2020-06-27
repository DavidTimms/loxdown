import Token from "./Token";
import LoxValue from "./LoxValue";
import RuntimeError from "./RuntimeError";
import LoxClass from "./LoxClass";

export default class NativeTypeMixin {
    constructor(readonly loxClass: LoxClass) {
        throw Error("NativeTypeMixin should not be instantiated directly");
    }

    get(this: LoxValue, name: Token): LoxValue {
        const method = this.loxClass.findMethod(name.lexeme);
        if (method !== undefined) {
            return method.bind(this);
        }

        throw new RuntimeError(
            name, `Undefined property '${name.lexeme}'.`);
    }

    set(this: LoxValue, name: Token, value: LoxValue): void {
        throw new RuntimeError(
            name, `Unable to assign properties to a ${this.loxClass.name}`);
    }
}
