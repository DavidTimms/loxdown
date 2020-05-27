export default class LoxString {
    readonly type = "STRING";
    constructor(readonly value: string) {}

    toString(): string {
        return this.value;
    }
}
