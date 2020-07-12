// This file is programatically generated. Do not edit it directly.

import Token from "./Token";

export class VariableTypeExpr {
    constructor(
        readonly name: Token,
    ) {}

    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitVariableTypeExpr(this);
    }
}

export type TypeExpr =
    VariableTypeExpr;

export default TypeExpr;

export interface TypeExprVisitor<R> {
    visitVariableTypeExpr(typeexpr: VariableTypeExpr): R;
}
