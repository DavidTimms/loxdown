// This file is programatically generated. Do not edit it directly.

import Token from "./Token";
import LoxValue from "./LoxValue";

export class AssignExpr {
    constructor(
        readonly name: Token,
        readonly value: Expr,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitAssignExpr(this);
    }
}

export class BinaryExpr {
    constructor(
        readonly left: Expr,
        readonly operator: Token,
        readonly right: Expr,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitBinaryExpr(this);
    }
}

export class CallExpr {
    constructor(
        readonly callee: Expr,
        readonly paren: Token,
        readonly args: Expr[],
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitCallExpr(this);
    }
}

export class GetExpr {
    constructor(
        readonly object: Expr,
        readonly name: Token,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGetExpr(this);
    }
}

export class GroupingExpr {
    constructor(
        readonly expression: Expr,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGroupingExpr(this);
    }
}

export class LiteralExpr {
    constructor(
        readonly value: LoxValue,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }
}

export class LogicalExpr {
    constructor(
        readonly left: Expr,
        readonly operator: Token,
        readonly right: Expr,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLogicalExpr(this);
    }
}

export class SetExpr {
    constructor(
        readonly object: Expr,
        readonly name: Token,
        readonly value: Expr,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitSetExpr(this);
    }
}

export class SuperExpr {
    constructor(
        readonly keyword: Token,
        readonly method: Token,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitSuperExpr(this);
    }
}

export class ThisExpr {
    constructor(
        readonly keyword: Token,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitThisExpr(this);
    }
}

export class UnaryExpr {
    constructor(
        readonly operator: Token,
        readonly right: Expr,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitUnaryExpr(this);
    }
}

export class VariableExpr {
    constructor(
        readonly name: Token,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitVariableExpr(this);
    }
}

export type Expr =
    AssignExpr |
    BinaryExpr |
    CallExpr |
    GetExpr |
    GroupingExpr |
    LiteralExpr |
    LogicalExpr |
    SetExpr |
    SuperExpr |
    ThisExpr |
    UnaryExpr |
    VariableExpr;

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
    visitSuperExpr(expr: SuperExpr): R;
    visitThisExpr(expr: ThisExpr): R;
    visitUnaryExpr(expr: UnaryExpr): R;
    visitVariableExpr(expr: VariableExpr): R;
}