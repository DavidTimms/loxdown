import Token from "./Token";
import LoxValue from "./LoxValue";
import RuntimeError from "./RuntimeError";
import LoxClass from "./LoxClass";

export default class NativeTypeMixin {
    static readonly loxClassName: string;

    get loxClass(): LoxClass {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const globals = require("./globals");
        const thisClass = this.constructor as typeof NativeTypeMixin;
        const loxClassName = thisClass.loxClassName;
        const loxClass = globals[loxClassName];
        if (loxClass === undefined) {
            throw new Error(
                `Unable to find runtime class for '${loxClassName}'.`);
        }
        Object.defineProperty(thisClass.prototype, "loxClass", {
            value: loxClass,
        });
        return loxClass;
    }

    get(this: LoxValue, name: Token): LoxValue {
        const method = this.loxClass.findMethod(name.lexeme);
        if (method !== undefined) {
            return method.bind(this);
        }

        throw new RuntimeError(
            `Undefined property '${name.lexeme}'.`, name);
    }

    set(this: LoxValue, name: Token, value: LoxValue): void {
        throw new RuntimeError(
            `Unable to assign properties to a ${this.loxClass.name}`, name);
    }
}
