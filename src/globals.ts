import NativeFunction from "./NativeFunction";
import LoxNumber from "./LoxNumber";
import LoxValue from "./LoxValue";
import { loxFalse, loxTrue } from "./LoxBool";
import LoxClass from "./LoxClass";
import { nil, LoxNil } from "./LoxNil";
import { isTruthy } from "./coreSemantics";
import LoxString from "./LoxString";
import RuntimeError from "./RuntimeError";

export const clock = new NativeFunction(
    () => new LoxNumber(Date.now() / 1000),
);

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
            throw new RuntimeError(
                `Unable to convert type '${className}' to a number.`);
        }

        const parsedValue = +value.value;

        if (isNaN(parsedValue)) {
            throw new RuntimeError("Invalid number.");
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
        throw new RuntimeError(
            "It is not possible to create a function " +
            "by calling the constructor.",
        );
    },
});

export const Class = new LoxClass("Class").withNativeMethods({
    init(): LoxValue {
        throw new RuntimeError(
            "It is not possible to create a class by calling the constructor.",
        );
    },
    getSuperclass(this: LoxClass): LoxClass | LoxNil {
        return this.superclass ?? nil;
    },
});
