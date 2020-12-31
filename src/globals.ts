import NativeFunction from "./NativeFunction";
import LoxNumber from "./LoxNumber";
import LoxValue from "./LoxValue";
import { loxFalse, loxTrue } from "./LoxBool";
import LoxClass from "./LoxClass";
import { nil, LoxNil } from "./LoxNil";
import { isTruthy } from "./coreSemantics";
import LoxString from "./LoxString";
import NativeRuntimeError from "./NativeRuntimeError";
import LoxArray from "./LoxArray";

export const clock = new NativeFunction(
    () => new LoxNumber(Date.now() / 1000),
);

export const assert = new NativeFunction((assertion, description) => {
    if (!isTruthy(assertion)) {
        throw new NativeRuntimeError(`Assertion Failed: ${description}`);
    }
    return nil;
});

export const isInstance = new NativeFunction(
    (value: LoxValue, loxClass: LoxValue) => {
        if (loxClass.type !== "CLASS") return loxFalse;

        let currentClass: LoxClass | null = value.loxClass;

        while (currentClass) {
            if (currentClass === loxClass) return loxTrue;
            currentClass = currentClass.superclass;
        }

        return loxFalse;
    },
);

export const type = new NativeFunction(
    (value: LoxValue) => value.loxClass ?? nil,
);

export const Nil = new LoxClass("Nil").withNativeMethods({
    init(): LoxValue {
        return nil;
    },
});

export const Boolean = new LoxClass("Boolean").withNativeMethods({
    init(value: LoxValue): LoxValue {
        return isTruthy(value) ? loxTrue : loxFalse;
    },
});

export const Number = new LoxClass("Number").withNativeMethods({
    init(value: LoxValue): LoxValue {
        if (value.type === "NUMBER") return value;

        if (value.type !== "STRING") {
            const className = value.loxClass.name;
            throw new NativeRuntimeError(
                `Unable to convert type '${className}' to a number.`);
        }

        const parsedValue = +value.value;

        if (isNaN(parsedValue)) {
            throw new NativeRuntimeError("Invalid number.");
        }

        return new LoxNumber(parsedValue);
    },
});

export const String = new LoxClass("String").withNativeMethods({
    init(value: LoxValue): LoxValue {
        return new LoxString(value.toString());
    },
});

export const Function = new LoxClass("Function").withNativeMethods({
    init(): LoxValue {
        throw new NativeRuntimeError(
            "It is not possible to create a function " +
            "by calling the constructor.",
        );
    },
});

export const Class = new LoxClass("Class").withNativeMethods({
    init(): LoxValue {
        throw new NativeRuntimeError(
            "It is not possible to create a class by calling the constructor.",
        );
    },
    getSuperclass(this: LoxClass): LoxClass | LoxNil {
        return this.superclass ?? nil;
    },
});

export const Array = new LoxClass("Array").withNativeMethods({
    init(): LoxArray {
        return new LoxArray();
    },
    append: LoxArray.prototype.append,
});
