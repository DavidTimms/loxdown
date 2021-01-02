import SourceRange from "./SourceRange";
import Token from "./Token";
import TypeExpr from "./TypeExpr";
import VariableExpr from "./VariableExpr";

export default class Superclass {
    constructor(
        readonly expr: VariableExpr,
        readonly genericArgs: TypeExpr[],
        readonly finalToken: Token,
    ) {}

    sourceRange(): SourceRange {
        return new SourceRange(
            this.expr.sourceRange().start,
            this.finalToken.sourceRange().end,
        );
    }
}
