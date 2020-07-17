import ClassType from "./ClassType";

export default class InstanceType {
    readonly tag = "INSTANCE";
    constructor(
        readonly classType: ClassType,
    ) {}

    toString(): string {
        return this.classType.name;
    }
}
