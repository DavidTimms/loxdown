export default class AnyType {
    readonly tag = "ANY";
    readonly classType = null;

    get callable(): null {
        return null;
    }

    toString(): string {
        return "Any";
    }
}
