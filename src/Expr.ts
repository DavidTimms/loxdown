// This file is programatically generated. Do not edit it directly.

import Token from "./Token";
import LoxValue from "./LoxValue";

export abstract class Expr {
    abstract accept<R>(visitor: ExprVisitor<R>): R;
}

export default Expr;

export interface ExprVisitor<R> {
    visitAssignExpr(expr: AssignExpr): R;
    visitBinaryExpr(expr: BinaryExpr): R;
    visitCallExpr(expr: CallExpr): R;
    visitGetExpr(expr: GetExpr): R;
    visitGroupingExpr(expr: GroupingExpr): R;
    visitLiteralExpr(expr: LiteralExpr): R;
    visitLogicalExpr(expr: LogicalExpr): R;
    visitSetExpr(expr: SetExpr): R;
    visitThisExpr(expr: ThisExpr): R;
    visitUnaryExpr(expr: UnaryExpr): R;
    visitVariableExpr(expr: VariableExpr): R;
}

export class AssignExpr extends Expr {
    constructor(
        readonly name: Token,
        readonly value: Expr,
    ) {
        super();
        this.name = name;
        this.value = value;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitAssignExpr(this);
    }
}

export class BinaryExpr extends Expr {
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

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitBinaryExpr(this);
    }
}

export class CallExpr extends Expr {
    constructor(
        readonly callee: Expr,
        readonly paren: Token,
        readonly args: Expr[],
    ) {
        super();
        this.callee = callee;
        this.paren = paren;
        this.args = args;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitCallExpr(this);
    }
}

export class GetExpr extends Expr {
    constructor(
        readonly object: Expr,
        readonly name: Token,
    ) {
        super();
        this.object = object;
        this.name = name;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGetExpr(this);
    }
}

export class GroupingExpr extends Expr {
    constructor(
        readonly expression: Expr,
    ) {
        super();
        this.expression = expression;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGroupingExpr(this);
    }
}

export class LiteralExpr extends Expr {
    constructor(
        readonly value: LoxValue,
    ) {
        super();
        this.value = value;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
}

export class LogicalExpr extends Expr {
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

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLogicalExpr(this);
    }
}

export class SetExpr extends Expr {
    constructor(
        readonly object: Expr,
        readonly name: Token,
        readonly value: Expr,
    ) {
        super();
        this.object = object;
        this.name = name;
        this.value = value;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitSetExpr(this);
    }
}

export class ThisExpr extends Expr {
    constructor(
        readonly keyword: Token,
    ) {
        super();
        this.keyword = keyword;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitThisExpr(this);
    }
}

export class UnaryExpr extends Expr {
    constructor(
        readonly operator: Token,
        readonly right: Expr,
    ) {
        super();
        this.operator = operator;
        this.right = right;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitUnaryExpr(this);
    }
}

export class VariableExpr extends Expr {
    constructor(
        readonly name: Token,
    ) {
        super();
        this.name = name;
    }

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitVariableExpr(this);
    }
}
