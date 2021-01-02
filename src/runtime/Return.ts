import LoxValue from "./LoxValue";

export default class Return {
    constructor(readonly value: LoxValue) {
        this.value = value;
    }
}
