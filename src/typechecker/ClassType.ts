import Type from "./Type";
import InstanceType from "./InstanceType";
import CallableType from "./CallableType";

export default class ClassType {
    readonly tag = "CLASS";

    // Because classes are themselves instances of the class 'Class',
    // we have to create an instance of the type to be the class type
    // of itself.
    static readonly metaClass = new ClassType("Class");

    constructor(
        readonly name: string,
        private readonly fields:
            Map<string, Type> = new Map(),
        private readonly methods:
            Map<string, Type> = new Map(),
        readonly superclass: ClassType | null = null,
    ) {}

    get classType(): ClassType {
        return ClassType.metaClass;
    }

    get callable(): CallableType {
        const initializer = this.methods.get("init")?.callable ?? null;
        return new CallableType(initializer?.params ?? [], this.instance());
    }

    findMember(name: string): Type | null {
        return (
            this.fields.get(name) ??
            this.methods.get(name) ??
            this.superclass?.findMember(name) ??
            null
        );
    }

    findMethod(name: string): Type | null {
        return (
            this.methods.get(name) ??
            this.superclass?.findMember(name) ??
            null
        );
    }

    toString(): string {
        return `class ${this.name}`;
    }

    instance(): InstanceType {
        return new InstanceType(this);
    }
}
