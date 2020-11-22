import CallableType, { CallableNarrowingProducer } from "./CallableType";
import { default as types } from "./builtinTypes";
import ClassType from "./ClassType";
import Type from "./Type";

/**
 * This informs the calling context that if an `isInstance` call returns
 * true, the first argument must be an instance of the second.
 */
const isInstanceNarrowingsProducer: CallableNarrowingProducer = (argTypes) => {
    const argNarrowings = new Map<number, Type>();
    if (argTypes[1] instanceof ClassType) {
        argNarrowings.set(0, argTypes[1].instance());
    }
    return argNarrowings;
};

export default {
    Nil: types.Nil.classType,
    Boolean: types.Boolean.classType,
    Number: types.Number.classType,
    String: types.String.classType,
    Function: types.Function.classType,
    Class: types.Class.classType,
    clock: new CallableType([], types.Number),
    assert: new CallableType([types.Any, types.String]),
    isInstance: new CallableType(
        [types.Any, types.Class], types.Boolean, isInstanceNarrowingsProducer),
};
