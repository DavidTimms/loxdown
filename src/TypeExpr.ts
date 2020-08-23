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

export class CallableTypeExpr {
    constructor(
        readonly paramTypes: TypeExpr[],
        readonly returnType: TypeExpr | null,
    ) {}

    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitCallableTypeExpr(this);
    }
}

export type TypeExpr =
    VariableTypeExpr |
    CallableTypeExpr;

export default TypeExpr;

export interface TypeExprVisitor<R> {
    visitVariableTypeExpr(typeExpr: VariableTypeExpr): R;
    visitCallableTypeExpr(typeExpr: CallableTypeExpr): R;
}
