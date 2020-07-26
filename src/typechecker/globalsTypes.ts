import CallableType from "./CallableType";
import { default as types } from "./builtinTypes";

export default {
    ...types,
    clock: new CallableType([], types.Number),
    assert: new CallableType([types.Any, types.String]),
    isInstance: new CallableType([types.Any, types.Class], types.Boolean),
};
