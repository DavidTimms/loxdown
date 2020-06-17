import NativeFunction from "./NativeFunction";
import LoxNumber from "./LoxNumber";
import LoxValue from "./LoxValue";
import { loxFalse, loxTrue } from "./LoxBool";
import LoxClass from "./LoxClass";

export const clock = new NativeFunction(
    () => LoxNumber.wrap(Date.now() / 1000),
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

const functionMethods = {
    init(): LoxValue {
        // TODO improve error
        throw Error("Cannot instantiate the Function class.");
    },
};

export const Function = new LoxClass(
    "Function",
    new Map(
        Object.entries(functionMethods)
            .map(([name, func]) => [name, new NativeFunction(func)]),
    ),
);
