import CallableType from "./CallableType";
import ClassType from "./ClassType";
import GenericParamType from "./GenericParamType";
import GenericType from "./GenericType";
import { numberInstanceType } from "./numberTypes";

const T = new GenericParamType("T");

const classType = new ClassType("Array", {
    methods: (): ClassType["methods"] => {
        const Number = numberInstanceType;
        const Array = classType.instance();

        return new Map([
            ["init", new CallableType([])],
            ["get", new CallableType([Number], T)],
            ["size", new CallableType([], Number)],
            ["append", new CallableType([T], Array)],
            ["reverse", new CallableType([], Array)],
            ["clear", new CallableType([], Array)],
            ["insertAt", new CallableType([Number, T], Array)],
            ["removeAt", new CallableType([Number], T)],
        ]);
    },
    genericArgs: [T],
});

export const arrayClassType = new GenericType([T], classType);
export const arrayInstanceType = new GenericType([T], classType.instance());
