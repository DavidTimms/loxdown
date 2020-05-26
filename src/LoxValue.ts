import LoxCallable from "./LoxCallable";
import LoxInstance from "./LoxInstance";
import { LoxNil } from "./LoxNil";
import { LoxBool } from "./LoxBool";

type LoxValue = number | string | LoxBool | LoxNil | LoxCallable | LoxInstance;
export default LoxValue;
