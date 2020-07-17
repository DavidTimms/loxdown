import Type from "./Type";
import InstanceType from "./InstanceType";

export default class ClassType {
    readonly tag = "CLASS";
    constructor(
        readonly name: string,
        private readonly fields:
            Map<string, Type> = new Map(),
        private readonly methods:
            Map<string, Type> = new Map(),
        readonly superclass: ClassType | null = null,
    ) {}

    toString(): string {
        return `class ${this.name}`;
    }

    instance(): InstanceType {
        return new InstanceType(this);
    }
}
