import LoxInstance from "./LoxInstance";
import * as globals from "./globals";

// store instance here to ensure LoxNil is a singleton
let _nil: LoxNil | null = null;

export class LoxNil extends LoxInstance {
    readonly type = "NIL";

    constructor(loxClass = globals.Nil) {
        super(loxClass);
        if (_nil) return _nil;
    }

    toString(): string {
        return "nil";
    }
}

export const nil = _nil = new LoxNil();
