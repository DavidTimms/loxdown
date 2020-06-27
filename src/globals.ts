import NativeFunction from "./NativeFunction";
import LoxNumber from "./LoxNumber";
import LoxValue from "./LoxValue";
import { loxFalse, loxTrue } from "./LoxBool";
import LoxClass from "./LoxClass";
import { nil, LoxNil } from "./LoxNil";
import { isTruthy } from "./coreSemantics";

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

export const type = new NativeFunction(
    (value: LoxValue) => value.loxClass ?? nil,
);

const nilMethods = {
    init(): LoxValue {
        return nil;
    },
};

export const Nil = new LoxClass(
    "Nil",
    new Map(
        Object.entries(nilMethods)
            .map(([name, func]) => [name, new NativeFunction(func)]),
    ),
);


const boolMethods = {
    init(value: LoxValue): LoxValue {
        return isTruthy(value) ? loxTrue : loxFalse;
    },
};

export const Boolean = new LoxClass(
    "Boolean",
    new Map(
        Object.entries(boolMethods)
            .map(([name, func]) => [name, new NativeFunction(func)]),
    ),
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

const classMethods = {
    init(): LoxValue {
        // TODO improve error
        throw Error("Cannot instantiate the Class class.");
    },
    getSuperclass(this: LoxClass): LoxClass | LoxNil {
        return this.superclass ?? nil;
    },
};

export const Class = new LoxClass(
    "Class",
    new Map(
        Object.entries(classMethods)
            .map(([name, func]) => [name, new NativeFunction(func)]),
    ),
);
