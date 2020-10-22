import ClassType from "./ClassType";
import InstanceType from "./InstanceType";
import CallableType from "./CallableType";
import AnyType from "./AnyType";
import UnionType from "./UnionType";

// TODO add FunctionType (combination of InstanceType and CallableType)

type Type = ClassType | InstanceType | CallableType | AnyType | UnionType;

export default Type;
