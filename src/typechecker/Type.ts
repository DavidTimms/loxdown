import ClassType from "./ClassType";
import InstanceType from "./InstanceType";
import CallableType from "./CallableType";
import AnyType from "./AnyType";
import UnionType from "./UnionType";
import GenericType from "./GenericType";
import GenericParamType from "./GenericParamType";
import types from "./builtinTypes";
import { zip } from "../helpers";
import ImplementationError from "../ImplementationError";
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
    isCompatible,
    unify,
    union,
    intersection,
    complement,
};

export default Type;

function unify(
    target: Type,
    candidate: Type,
    generics: GenericParamMap | null = null,
): boolean {
    return (
        candidate === types.PreviousTypeError ||
        target.unify(candidate, generics)
    );
}

function isCompatible(candidate: Type, target: Type): boolean {
    // 'PreviousTypeError' is used to avoid cascading type errors
    // so it can be assigned to anything.
    if (candidate === types.PreviousTypeError) return true;

    return target.unify(candidate);

    // switch (target.tag) {
    //     // Anything can be assigned to an 'Any' type.
    //     case "ANY": {
    //         return true;
    //     }
    //     case "INSTANCE": {
    //         return (
    //             candidate.classType !== null &&
    //             isClassCompatible(candidate.classType, target.classType)
    //         );
    //     }
    //     case "CALLABLE": {
    //         const callable = candidate.callable;
    //         return (
    //             callable !== null &&
    //             isCallableCompatible(callable, target)
    //         );
    //     }
    //     case "UNION": {
    //         const candidates =
    //             candidate.tag === "UNION" ? candidate.children : [candidate];

    //         return candidates.every(candidate =>
    //             target.children.some(child => isCompatible(candidate, child)),
    //         );
    //     }
    //     case "CLASS": {
    //         return isClassCompatible(candidate, target);
    //     }
    //     case "GENERIC": {
    //         // To test whether two generic type are compatible, we instantiate
    //         // one of them with the generic param types of the other. This
    //         // means the same type objects represent each type parameter in
    //         // both types, allowing a normal compatibility check to be used.
    //         if (
    //             candidate instanceof GenericType &&
    //             target.params.length === target.params.length
    //         ) {
    //             const instantiatedCandidate =
    //                 candidate.instantiate(target.params);

    //             if (instantiatedCandidate.errors.length > 0) {
    //                 throw new ImplementationError(
    //                     "Errors while instantiating candidate for generic " +
    //                     "compatibility check. " +
    //                     instantiatedCandidate.errors.join(" "),
    //                 );
    //             }
    //             return isCompatible(instantiatedCandidate.type, target.body);
    //         }
    //         return false;
    //     }
    //     case "GENERIC_PARAM": {
    //         return candidate === target;
    //     }
    // }
}

export function isClassCompatible(
    candidate: Type,
    target: ClassType,
): boolean {
    if (!(candidate instanceof ClassType)) return false;

    let current: ClassType | null = candidate;
    while (current) {
        if (current.genericRoot === target.genericRoot) {
            // At the moment, all generic classes are treated as covariant.
            // This will lead to unsoundness, so could be changed later.
            return (
                zip(current.genericArgs, target.genericArgs)
                    .every(([candidateArg, targetArg]) =>
                        isCompatible(candidateArg, targetArg),
                    )
            );
        }
        current = current.superclass;
    }
    return false;
}

export function isCallableCompatible(
    candidate: CallableType,
    target: CallableType,
): boolean {
    // Each *target* parameter type must be a subtype of the *candidate*
    // parameter type.
    const areParamsCompatible =
    candidate.params.length === target.params.length &&
    candidate.params.every(
        (candidateParam, i) => isCompatible(
            target.params[i],
            candidateParam,
        ));

    if (!areParamsCompatible) return false;

    // The *candidate* return type must be a subtype of the *target*
    // return type.
    const areReturnTypesCompatible =
        (
            candidate.returns &&
            target.returns &&
            isCompatible(candidate.returns, target.returns)
        ) || (
            candidate.returns === null &&
            target.returns === null
        );

    return areReturnTypesCompatible;
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

    let combinedChildren = left.tag === "UNION" ? left.children : [left];
    const rightChildren = right.tag === "UNION" ? right.children : [right];

    for (const newChild of rightChildren) {
        if (!combinedChildren.some(existingChild =>
            isCompatible(newChild, existingChild))
        ) {
            combinedChildren =
                combinedChildren
                    .filter(existingChild =>
                        !isCompatible(existingChild, newChild))
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
    if (isCompatible(left, right)) {
        return left;
    } else if (isCompatible(right, left)) {
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
            left.children.filter(child => !isCompatible(child, right));

        if (childrenNotInRight.length === 0) {
            return types.PreviousTypeError;
        } else if (childrenNotInRight.length === 1) {
            return childrenNotInRight[0];
        }
        return new UnionType(childrenNotInRight);
    }

    if (isCompatible(left, right)) {
        return types.PreviousTypeError;
    }

    return left;
}
