import AnyType from "./AnyType";
import CallableType from "./CallableType";
import ClassType from "./ClassType";

const Any = new AnyType();

export const numberInstanceType = new ClassType("Number", {
    methods: new Map([
        ["init", new CallableType([Any])],
    ]),
}).instance();
