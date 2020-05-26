export class LoxBool {
    readonly type = "BOOL";
    private static readonly instances = new Map<boolean, LoxBool>();

    constructor(readonly isTrue: boolean) {
        const instance = LoxBool.instances.get(isTrue);
        if (instance) return instance;
        LoxBool.instances.set(isTrue, this);
    }

    toString(): string {
        return String(this.isTrue);
    }
}

export const loxTrue = new LoxBool(true);
export const loxFalse = new LoxBool(false);
