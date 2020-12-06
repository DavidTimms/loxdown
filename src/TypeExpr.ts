// This file is programmatically generated. Do not edit it directly.

import Token from "./Token";

export class CallableTypeExpr {
    constructor(
        readonly paramTypes: TypeExpr[],
        readonly returnType: TypeExpr | null,
    ) {}

    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitCallableTypeExpr(this);
    }
}

export class UnionTypeExpr {
    constructor(
        readonly left: TypeExpr,
        readonly operator: Token,
        readonly right: TypeExpr,
    ) {}

    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitUnionTypeExpr(this);
    }
}

export class VariableTypeExpr {
    constructor(
        readonly name: Token,
    ) {}

    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitVariableTypeExpr(this);
    }
}

export class GenericTypeExpr {
    constructor(
        readonly name: Token,
        readonly genericArgs: TypeExpr[],
    ) {}

    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitGenericTypeExpr(this);
    }
}

export type TypeExpr =
    CallableTypeExpr |
    UnionTypeExpr |
    VariableTypeExpr |
    GenericTypeExpr;

export default TypeExpr;

export interface TypeExprVisitor<R> {
    visitCallableTypeExpr(typeExpr: CallableTypeExpr): R;
    visitUnionTypeExpr(typeExpr: UnionTypeExpr): R;
    visitVariableTypeExpr(typeExpr: VariableTypeExpr): R;
    visitGenericTypeExpr(typeExpr: GenericTypeExpr): R;
}
