import AnyType from "./AnyType";
import ClassType from "./ClassType";
import CallableType from "./CallableType";
import { arrayInstanceType } from "./arrayTypes";

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
    Number: new ClassType("Number", {
        methods: new Map([
            ["init", new CallableType([Any])],
        ]),
    }).instance(),
    String: new ClassType("String", {
        methods: new Map([
            ["init", new CallableType([Any])],
        ]),
    }).instance(),
    Array: arrayInstanceType,
    Function: new ClassType("Function").instance(),
    Class: ClassType.metaClass.instance(),
};
