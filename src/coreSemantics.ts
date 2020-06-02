import { nil } from "./LoxNil";
import { loxFalse } from "./LoxBool";
import LoxValue from "./LoxValue";
import LoxString from "./LoxString";

export function isEqual(left: LoxValue, right: LoxValue): boolean {
    if (left.type === "NUMBER" && right.type === "NUMBER") {
        return left.value === right.value;
    }
    if (left.type === "STRING" && right.type === "STRING") {
        return (left as LoxString).value === (right as LoxString).value;
    }
    return left === right;
}

export function isTruthy(value: LoxValue): boolean {
    return value !== nil && value !== loxFalse;
}
