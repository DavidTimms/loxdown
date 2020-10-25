import ClassType from "./ClassType";
import InstanceType from "./InstanceType";
import CallableType from "./CallableType";
import AnyType from "./AnyType";
import UnionType from "./UnionType";
import { default as types } from "./builtinTypes";

// TODO add FunctionType (combination of InstanceType and CallableType)

type Type = ClassType | InstanceType | CallableType | AnyType | UnionType;

const Type = {
    isCompatible(candidate: Type, target: Type): boolean {
        // 'PreviousTypeError' is used to avoid cascading type errors
        // so it can be assigned to anything.
        if (candidate === types.PreviousTypeError) return true;

        switch (target.tag) {
            // Anything can be assigned to an 'Any' type.
            case "ANY": {
                return true;
            }
            case "INSTANCE": {
                // An instance is compatible with its superclass.
                let currentClassType: ClassType | null = candidate.classType;
                while (currentClassType) {
                    if (currentClassType === target.classType) return true;
                    currentClassType = currentClassType.superclass;
                }
                return false;
            }
            case "CALLABLE": {
                const callable = candidate.callable;
                return (
                    callable !== null &&
                    Type.isCallableCompatible(callable, target)
                );
            }
            case "UNION": {
                return target.children.some(
                    child => Type.isCompatible(candidate, child));
            }
            case "CLASS": {
                return candidate === target;
            }
        }
    },

    isCallableCompatible(
        candidate: CallableType,
        target: CallableType,
    ): boolean {
        // Each *target* parameter type must be a subtype of the *candidate*
        // parameter type.
        const areParamsCompatible =
        candidate.params.length === target.params.length &&
        candidate.params.every(
            (candidateParam, i) => Type.isCompatible(
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
                Type.isCompatible(candidate.returns, target.returns)
            ) || (
                candidate.returns === null &&
                target.returns === null
            );

        return areReturnTypesCompatible;
    },

    union(left: Type, right: Type): Type {
        if (left === right) return left;

        if (
            left === types.PreviousTypeError ||
            right === types.PreviousTypeError
        ) {
            return types.PreviousTypeError;
        }

        // TODO avoid duplicates, subsumed subtypes and nested unions

        let combinedChildren = left.tag === "UNION" ? left.children : [left];
        const rightChildren = right.tag === "UNION" ? right.children : [right];

        for (const newChild of rightChildren) {
            if (!combinedChildren.some(existingChild =>
                Type.isCompatible(newChild, existingChild))
            ) {
                combinedChildren =
                    combinedChildren
                        .filter(existingChild =>
                            !Type.isCompatible(existingChild, newChild))
                        .concat([newChild]);
            }
        }

        return new UnionType(combinedChildren);
    },
};

export default Type;
