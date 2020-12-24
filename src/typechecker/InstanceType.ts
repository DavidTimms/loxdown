import ClassType from "./ClassType";
import { FullGenericParamMap, GenericParamMap } from "./GenericParamMap";
import Type from "./Type";

export default class InstanceType {
    readonly tag = "INSTANCE";
    constructor(
        readonly classType: ClassType,
    ) {}

    get callable(): null {
        return null;
    }

    get(name: string): Type | null {
        return this.classType.findMember(name);
    }

    toString(): string {
        return this.classType.instanceString();
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

    instantiateGenerics(generics: FullGenericParamMap): Type {
        return new InstanceType(
            this.classType.instantiateGenerics(generics),
        );
    }

    unify(candidate: Type, generics: GenericParamMap | null = null): boolean {
        return (
            candidate.classType !== null &&
            Type.unify(this.classType, candidate.classType, generics)
        );
    }
}
