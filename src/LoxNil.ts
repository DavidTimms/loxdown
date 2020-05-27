import LoxClass from "./LoxClass";
import LoxInstance from "./LoxInstance";

// store instance here to ensure LoxNil is a singleton
let _nil: LoxNil | null = null;

export class LoxNil extends LoxInstance {
    // TODO throw error if somebody tries to instantiate the Nil class
    static readonly loxClass = new LoxClass("Nil");
    readonly type = "NIL";

    constructor(loxClass = LoxNil.loxClass) {
        super(loxClass);
        if (_nil) return _nil;
    }

    toString(): string {
        return "nil";
    }
}

export const nil = _nil = new LoxNil();
