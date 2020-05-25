import LoxCallable from "./LoxCallable";
import LoxInstance from "./LoxInstance";
import { LoxNil } from "./LoxNil";

type LoxValue = number | string | boolean | LoxNil | LoxCallable | LoxInstance;
export default LoxValue;
