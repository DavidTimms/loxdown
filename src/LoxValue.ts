import LoxInstance from "./LoxInstance";
import { LoxNil } from "./LoxNil";
import { LoxBool } from "./LoxBool";
import LoxString from "./LoxString";
import LoxNumber from "./LoxNumber";
import LoxFunction from "./LoxFunction";
import NativeFunction from "./NativeFunction";
import LoxClass from "./LoxClass";

type LoxValue =
    LoxNumber |
    LoxString |
    LoxBool |
    LoxNil |
    LoxFunction |
    NativeFunction |
    LoxClass |
    LoxInstance;

export default LoxValue;
