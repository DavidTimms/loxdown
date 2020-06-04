import { nil } from "./LoxNil";
import { loxFalse } from "./LoxBool";
import LoxValue from "./LoxValue";
import LoxString from "./LoxString";
import LoxNumber from "./LoxNumber";

export function isEqual(left: LoxValue, right: LoxValue): boolean {
    if (left.type === "NUMBER" && right.type === "NUMBER") {
        return (left as LoxNumber).value === (right as LoxNumber).value;
    }
    if (left.type === "STRING" && right.type === "STRING") {
        return (left as LoxString).value === (right as LoxString).value;
    }
    return left === right;
}

export function isTruthy(value: LoxValue): boolean {
    return value !== nil && value !== loxFalse;
}
