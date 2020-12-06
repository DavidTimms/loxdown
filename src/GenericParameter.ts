import Token from "./Token";
import TypeExpr from "./TypeExpr";


export default class GenericParameter {
    constructor(readonly name: Token, readonly superType: TypeExpr | null) {}
}
