export default class LoxNumber {
    readonly type = "NUMBER";
    constructor(readonly value: number) {}

    toString(): string {
        return String(this.value);
    }
}

