import LoxClass from "./LoxClass";
import LoxInstance from "./LoxInstance";
import NativeFunction from "./NativeFunction";
import LoxValue from "./LoxValue";
import LoxString from "./LoxString";

const numberMethods = {
    init(value: LoxValue): LoxValue {
        if (value.type === "NUMBER") return value;

        if (value.type !== "STRING") {
            // TODO use runtime Lox class name instead of internal type
            const className = value.type;
            throw Error(`Unable to convert type '${className}' to a number.`);
        }

        const parsedValue = Number((value as LoxString).value);

        if (isNaN(parsedValue)) {
            throw Error("Invalid number.");
        }

        return LoxNumber.wrap(parsedValue);
    },
};

export default class LoxNumber extends LoxInstance {
    readonly type = "NUMBER";
    static readonly loxClass = new LoxClass(
        "Number",
        new Map(
            Object.entries(numberMethods)
                .map(([name, func]) => [name, new NativeFunction(func)]),
        ),
    );

    constructor(loxClass: LoxClass, readonly value: number) {
        super(loxClass);
    }

    toString(): string {
        return String(this.value);
    }

    static wrap(value: number): LoxNumber {
        return new LoxNumber(LoxNumber.loxClass, value);
    }
}

