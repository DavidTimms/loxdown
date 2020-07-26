import AnyType from "./AnyType";
import ClassType from "./ClassType";

export default {
    Any: new AnyType(),
    PreviousTypeError: new AnyType(),
    Nil: new ClassType("Nil").instance(),
    Boolean: new ClassType("Boolean").instance(),
    Number: new ClassType("Number").instance(),
    String: new ClassType("String").instance(),
};
