import ClassType from "./ClassType";

export default class InstanceType {
    readonly tag = "INSTANCE";
    constructor(
        readonly classType: ClassType,
    ) {}

    get callable(): null {
        return null;
    }

    toString(): string {
        return this.classType.name;
    }

    inheritanceChain(): ClassType[] {
        const chain = [];

        for (
            let current: ClassType | null = this.classType;
            current;
            current = current.superclass
        ) {
            chain.unshift(current);
        }
        return chain;
    }
}
