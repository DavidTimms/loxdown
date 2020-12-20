import Type, { isClassCompatible } from "./Type";
import InstanceType from "./InstanceType";
import CallableType from "./CallableType";
import { FullGenericParamMap, GenericParamMap } from "./GenericParamMap";
import { mapValues } from "../helpers";

export default class ClassType {
    readonly tag = "CLASS";
    fields: Map<string, Type>;
    methods: Map<string, Type>;
    readonly superclass: ClassType | null;
    readonly genericArgs: Type[];

    // The generic root is the original uninstantiated version of this class
    readonly genericRoot: ClassType;

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
            genericArgs = [],
            genericRoot = null,
        }: {
            fields?: ClassType["fields"];
            methods?: ClassType["methods"];
            superclass?: ClassType["superclass"];
            genericArgs?: ClassType["genericArgs"];
            genericRoot?: ClassType["genericRoot"] | null;
        } = {},
    ) {
        this.fields = fields;
        this.methods = methods;
        this.superclass = superclass;
        this.genericArgs = genericArgs;
        this.genericRoot = genericRoot ?? this;
    }

    instanceString(): string {
        const generics =
            this.genericArgs.length > 0 ?
                `[${this.genericArgs.join(", ")}]` : "";
        return this.name + generics;
    }

    toString(): string {
        return `class ${this.instanceString()}`;
    }

    get classType(): ClassType {
        return ClassType.metaClass;
    }

    get callable(): CallableType {
        const initializer = this.findMethod("init")?.callable ?? null;
        // Pass generic params on to callable
        return new CallableType(initializer?.params ?? [], this.instance());
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

    instantiateGenerics(generics: FullGenericParamMap): ClassType {
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

        const genericArgs = this.genericArgs.map(
            argType => argType.instantiateGenerics(generics),
        );

        const genericRoot = this.genericRoot;

        return new ClassType(
            this.name,
            {fields, methods, superclass, genericArgs, genericRoot},
        );
    }

    unify(candidate: Type, generics: GenericParamMap | null = null): boolean {
        // TODO proper unification for classes
        return isClassCompatible(candidate, this);
    }
}

ClassType.metaClass.methods.set(
    "getSuperclass",
    new CallableType([], ClassType.metaClass.instance()),
);
