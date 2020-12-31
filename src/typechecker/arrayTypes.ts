import CallableType from "./CallableType";
import ClassType from "./ClassType";
import GenericParamType from "./GenericParamType";
import GenericType from "./GenericType";

const T = new GenericParamType("T");

const classType = new ClassType("Array", {
    methods: (): ClassType["methods"] => new Map([
        ["init", new CallableType([])],
        ["append", new CallableType([T], classType.instance())],
    ]),
    genericArgs: [T],
});

export const arrayClassType = new GenericType([T], classType);
export const arrayInstanceType = new GenericType([T], classType.instance());
