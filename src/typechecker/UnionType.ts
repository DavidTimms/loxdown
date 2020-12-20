import { FullGenericParamMap, GenericParamMap } from "./GenericParamMap";
import Type from "./Type";

export default class UnionType {
    readonly tag = "UNION";
    readonly classType = null;

    constructor(
        readonly children: Type[],
    ) {}

    get callable(): null {
        return null;
    }

    get(name: string): Type | null {
        let member = this.children[0].get(name);

        for (const child of this.children) {
            const childMember = child.get(name);
            if (childMember === null || member === null) return null;
            member = Type.union(member, childMember);
        }
        return member;
    }

    toString(): string {
        return this.children.join(" | ");
    }

    instantiateGenerics(generics: FullGenericParamMap): Type {
        const children =
            this.children.map(child => child.instantiateGenerics(generics));
        return children.reduce(Type.union);
    }

    unify(candidate: Type, generics: GenericParamMap | null = null): boolean {
        const candidates =
                candidate.tag === "UNION" ? candidate.children : [candidate];

        // TODO deep unification for unions
        return candidates.every(candidate =>
            this.children.some(child => Type.isCompatible(candidate, child)),
        );
    }
}
