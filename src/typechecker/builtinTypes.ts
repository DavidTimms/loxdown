import AnyType from "./AnyType";
import ClassType from "./ClassType";
import CallableType from "./CallableType";
import { arrayInstanceType } from "./arrayTypes";
import { numberInstanceType } from "./numberTypes";

const Any = new AnyType();

export default {
    Any,
    PreviousTypeError: new AnyType(),
    Nil: new ClassType("Nil").instance(),
    Boolean: new ClassType("Boolean", {
        methods: new Map([
            ["init", new CallableType([Any])],
        ]),
    }).instance(),
    Number: numberInstanceType,
    String: new ClassType("String", {
        methods: new Map([
            ["init", new CallableType([Any])],
        ]),
    }).instance(),
    Array: arrayInstanceType,
    Function: new ClassType("Function").instance(),
    Class: ClassType.metaClass.instance(),
};
