import Type from "./Type";

export default class ClassType {
    constructor(
        readonly name: string,
        private readonly members:
            Map<string, Type> = new Map(),
        readonly superclass: ClassType | null = null,
    ) {}

    toString(): string {
        return this.name;
    }
}
