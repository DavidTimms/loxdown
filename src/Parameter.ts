import Token from "./Token";
import TypeExpr from "./TypeExpr";


export default class Parameter {
    constructor(
        readonly name: Token,
        readonly type: TypeExpr,
    ) {}
}
