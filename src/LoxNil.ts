// store instance here to ensure LoxNil is a singleton
let _nil: LoxNil | null = null;

export class LoxNil {
    readonly type = "NIL";

    constructor() {
        if (_nil) return _nil;
    }

    toString(): string {
        return "nil";
    }
}

export const nil = _nil = new LoxNil();
