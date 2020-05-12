import LoxCallable from "./LoxCallable";
import LoxInstance from "./LoxInstance";

type LoxValue = number | string | boolean | null | LoxCallable | LoxInstance;
export default LoxValue;
