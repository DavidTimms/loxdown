import ClassType from "./ClassType";
import InstanceType from "./InstanceType";
import CallableType from "./CallableType";
import AnyType from "./AnyType";
import UnionType from "./UnionType";
import GenericType from "./GenericType";
import GenericParamType from "./GenericParamType";
import types from "./builtinTypes";
import { zip } from "../helpers";
import { GenericParamMap } from "./GenericParamMap";

// TODO add FunctionType (combination of InstanceType and CallableType)

type Type =
    | ClassType
    | InstanceType
    | CallableType
    | AnyType
    | UnionType
    | GenericType
    | GenericParamType;

const Type = {
    unify,
    union,
    intersection,
    complement,
    children,
};

export default Type;

/**
 * Returns true if the candidate is a subtype of the target. If a map of
 * generics is provided, it may bind types to the generic parameters by
 * modifying the map.
 */
function unify(
    target: Type,
    candidate: Type,
    generics: GenericParamMap | null = null,
): boolean {
    // Normally the parameters being inferred will be in the target type,
    // but when unifying function parameters, the subtyping relationship
    // gets flipped. Here we bind the candidate parameter if possible.
    if (candidate instanceof GenericParamType) {
        const boundType = generics?.get(candidate);

        if (boundType) {
            // If a type is bound to itself, that means it is a recursive call,
            // so we must return here to avoid an infinite loop.
            if (boundType === candidate) {
                return true;
            }
            // The parameter is being inferred, and has already been bound
            // to type, so we attempt to unify the target with that bound type.
            return target.unify(boundType, generics);

        } else if (boundType === null) {
            // The parameter is being inferred, but has not yet been bound
            // to a type, so we bind it to the target type here.
            generics?.set(candidate, target);
            return true;
        }
    } else if (
        candidate instanceof GenericType &&
        !(target instanceof GenericType)
    ) {
        generics = generics ?? new Map();
        const distinctParams = candidate.cloneParams();
        for (const distinctParam of distinctParams) {
            generics.set(distinctParam, null);
        }
        const typeWithDistinctParams =
            candidate.instantiate(distinctParams).type;
        return Type.unify(target, typeWithDistinctParams, generics);
    }

    // 'PreviousTypeError' is used to avoid cascading type errors
    // so it can be unified with anything.
    return (
        candidate === types.PreviousTypeError ||
        target.unify(candidate, generics)
    );
}

function union(left: Type, right: Type): Type {
    if (left === right) return left;

    if (
        left === types.PreviousTypeError ||
        right === types.PreviousTypeError
    ) {
        return types.PreviousTypeError;
    }

    if (left.tag === "CALLABLE" && right.tag === "CALLABLE") {
        return (
            attemptUnionOfCallables(left, right) ??
            new UnionType([left, right])
        );
    }

    let combinedChildren = Type.children(left);
    const rightChildren = Type.children(right);

    for (const newChild of rightChildren) {
        if (!combinedChildren.some(existingChild =>
            Type.unify(existingChild, newChild))
        ) {
            combinedChildren =
                combinedChildren
                    .filter(existingChild =>
                        !Type.unify(newChild, existingChild))
                    .concat([newChild]);
        }
    }

    if (combinedChildren.length === 1) return combinedChildren[0];

    return new UnionType(combinedChildren);
}

function attemptUnionOfCallables(
    left: CallableType,
    right: CallableType,
): CallableType | null {
    if (left.params.length !== right.params.length) {
        return null;
    }

    const paramTypes = [];

    for (const paramPair of zip(left.params, right.params)) {
        const paramType = intersection(...paramPair);
        if (paramType === null) {
            return null;
        }
        paramTypes.push(paramType);
    }

    const returnType =
        union(left.returns ?? types.Nil, right.returns ?? types.Nil);

    return new CallableType(paramTypes, returnType);
}

/**
 * Find the type which is compatible with both types.
 */
function intersection(left: Type, right: Type): Type | null {
    if (Type.unify(right, left)) {
        return left;
    } else if (Type.unify(left, right)) {
        return right;
    }
    return null;
}

/**
 * Find the type of values which compatible with left but not right.
 * This is a relative complement in set theory.
 */
function complement(left: Type, right: Type): Type {
    // TODO introduce Never type where this currently returns PreviousTypeError

    if (left.tag === "UNION") {
        const childrenNotInRight =
            left.children.filter(child => !Type.unify(right, child));

        if (childrenNotInRight.length === 0) {
            return types.PreviousTypeError;
        } else if (childrenNotInRight.length === 1) {
            return childrenNotInRight[0];
        }
        return new UnionType(childrenNotInRight);
    }

    if (Type.unify(right, left)) {
        return types.PreviousTypeError;
    }

    return left;
}

function children(type: Type): Type[] {
    return type.tag === "UNION" ? type.children : [type];
}
