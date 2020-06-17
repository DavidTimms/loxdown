import LoxInstance from "./LoxInstance";
import * as globals from "./globals";


export class LoxBool extends LoxInstance {
    readonly type = "BOOL";
    private static readonly instances = new Map<boolean, LoxBool>();

    constructor(loxClass = globals.Boolean, readonly isTrue: boolean = true) {
        super(loxClass);
        const instance = LoxBool.instances.get(isTrue);
        if (instance) return instance;
        LoxBool.instances.set(isTrue, this);
    }

    toString(): string {
        return String(this.isTrue);
    }
}

export const loxTrue = new LoxBool(globals.Boolean, true);
export const loxFalse = new LoxBool(globals.Boolean, false);
