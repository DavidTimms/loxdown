import CallableType from "./CallableType";
import { default as types } from "./builtinTypes";

export default {
    Nil: types.Nil.classType,
    Boolean: types.Boolean.classType,
    Number: types.Number.classType,
    String: types.String.classType,
    Function: types.Function.classType,
    Class: types.Class.classType,
    clock: new CallableType([], types.Number),
    assert: new CallableType([types.Any, types.String]),
    isInstance: new CallableType([types.Any, types.Class], types.Boolean),
};
