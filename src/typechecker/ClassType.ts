import Type from "./Type";
import InstanceType from "./InstanceType";
import CallableType from "./CallableType";
import { GenericParamMap } from "./GenericParamMap";
import { mapValues } from "../helpers";

export default class ClassType {
    readonly tag = "CLASS";
    fields: Map<string, Type>;
    methods: Map<string, Type>;
    superclass: ClassType | null;

    // Because classes are themselves instances of the class 'Class',
    // we have to create an instance of the type to be the class type
    // of itself.
    static readonly metaClass = new ClassType("Class");

    constructor(
        readonly name: string,
        {
            fields = new Map(),
            methods = new Map(),
            superclass = null,
        }: {
            fields?: ClassType["fields"];
            methods?: ClassType["methods"];
            superclass?: ClassType["superclass"];
        } = {},
    ) {
        this.fields = fields;
        this.methods = methods;
        this.superclass = superclass;
    }

    toString(): string {
        return `class ${this.name}`;
    }

    get classType(): ClassType {
        return ClassType.metaClass;
    }

    get callable(): CallableType {
        const initializer = this.findMethod("init")?.callable ?? null;
        // Pass generic params on to callable
        return new CallableType([], initializer?.params ?? [], this.instance());
    }

    get(name: string): Type | null {
        return this.classType.instance().get(name);
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
            this.superclass?.findMethod(name) ??
            null
        );
    }

    instance(): InstanceType {
        return new InstanceType(this);
    }

    instantiateGenerics(generics: GenericParamMap): ClassType {
        // TODO cache instantiations to ensure different instantiations
        //      with the same types given the same object.

        const fields = mapValues(
            this.fields,
            fieldType => fieldType.instantiateGenerics(generics),
        );
        const methods = mapValues(
            this.methods,
            methodType => methodType.instantiateGenerics(generics),
        );
        const superclass =
            this.superclass && this.superclass.instantiateGenerics(generics);

        return new ClassType(
            this.name,
            {fields, methods, superclass},
        );
    }
}

ClassType.metaClass.methods.set(
    "getSuperclass",
    new CallableType([], [], ClassType.metaClass.instance()),
);
