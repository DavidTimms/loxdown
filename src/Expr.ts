// This file is programatically generated. Do not edit it directly.

import Token from "./Token";
import LiteralValue from "./LiteralValue";

export abstract class Expr {
    abstract accept<R>(visitor: Visitor<R>): R;
}

export interface Visitor<R> {
    visitBinaryExpr(expr: Binary): R;
    visitGroupingExpr(expr: Grouping): R;
    visitLiteralExpr(expr: Literal): R;
    visitUnaryExpr(expr: Unary): R;
}

export class Binary extends Expr {
    constructor(
        readonly left: Expr,
        readonly operator: Token,
        readonly right: Expr,
    ) {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitBinaryExpr(this);
    }
}

export class Grouping extends Expr {
    constructor(
        readonly expression: Expr,
    ) {
        super();
        this.expression = expression;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitGroupingExpr(this);
    }
}

export class Literal extends Expr {
    constructor(
        readonly value: LiteralValue,
    ) {
        super();
        this.value = value;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
}

export class Unary extends Expr {
    constructor(
        readonly operator: Token,
        readonly right: Expr,
    ) {
        super();
        this.operator = operator;
        this.right = right;
    }

    accept<R>(visitor: Visitor<R>): R {
        return visitor.visitUnaryExpr(this);
    }
}
