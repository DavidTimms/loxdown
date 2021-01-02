import Token from "./Token";
import TypeExpr from "./TypeExpr";


export default class Field {
    constructor(readonly name: Token, readonly type: TypeExpr) {}
}
