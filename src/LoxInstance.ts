import LoxClass from "./LoxClass";

export default class LoxInstance {
    constructor(private loxClass: LoxClass) {
        this.loxClass = loxClass;
    }

    toString(): string {
        return `${this.loxClass.name} instance`;
    }
}
