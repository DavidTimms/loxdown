import CallableType, { CallableNarrowingProducer } from "./CallableType";
import { default as types } from "./builtinTypes";
import ClassType from "./ClassType";
import Type from "./Type";
import GenericType from "./GenericType";
import { arrayClassType } from "./arrayTypes";

/**
 * This informs the calling context that if an `isInstance` call returns
 * true, the first argument must be an instance of the second.
 */
const isInstanceNarrowingsProducer: CallableNarrowingProducer = (argTypes) => {
    const argNarrowings = new Map<number, Type>();
    const rootClassType = GenericType.unwrap(argTypes[1]);

    if (rootClassType instanceof ClassType) {
        const narrowedChildren = Type.children(argTypes[0]).filter(child => {
            const classType = child.classType;
            return classType && classType.genericRoot === rootClassType;
        });

        if (narrowedChildren.length > 0) {
            argNarrowings.set(0, narrowedChildren.reduce(Type.union));
        }
    }
    return argNarrowings;
};

export default {
    Nil: types.Nil.classType,
    Boolean: types.Boolean.classType,
    Number: types.Number.classType,
    String: types.String.classType,
    Array: arrayClassType,
    Function: types.Function.classType,
    Class: types.Class.classType,
    clock: new CallableType([], types.Number),
    assert: new CallableType([types.Any, types.String]),
    isInstance: new CallableType(
        [types.Any, types.Class],
        types.Boolean,
        isInstanceNarrowingsProducer,
    ),
};
