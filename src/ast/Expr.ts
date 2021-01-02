// This file is programmatically generated. Do not edit it directly.

import Token from "./Token";
import TypeExpr from "./TypeExpr";
import LoxValue from "../runtime/LoxValue";
import SourceRange from "./SourceRange";

export class ArrayExpr {
    constructor(
        readonly openingBracket: Token,
        readonly items: Expr[],
        readonly closingBracket: Token,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitArrayExpr(this);
    }

    sourceRange(): SourceRange {
        const start = (this.openingBracket).sourceRange().start;
        const end = (this.closingBracket).sourceRange().end;
        return new SourceRange(start, end);
    }
}

export class AssignExpr {
    constructor(
        readonly name: Token,
        readonly value: Expr,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitAssignExpr(this);
    }

    sourceRange(): SourceRange {
        const start = (this.name).sourceRange().start;
        const end = (this.value).sourceRange().end;
        return new SourceRange(start, end);
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

    sourceRange(): SourceRange {
        const start = (this.left).sourceRange().start;
        const end = (this.right).sourceRange().end;
        return new SourceRange(start, end);
    }
}

export class CallExpr {
    constructor(
        readonly callee: Expr,
        readonly genericArgs: TypeExpr[],
        readonly args: Expr[],
        readonly closingParen: Token,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitCallExpr(this);
    }

    sourceRange(): SourceRange {
        const start = (this.callee).sourceRange().start;
        const end = (this.closingParen).sourceRange().end;
        return new SourceRange(start, end);
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

    sourceRange(): SourceRange {
        const start = (this.object).sourceRange().start;
        const end = (this.name).sourceRange().end;
        return new SourceRange(start, end);
    }
}

export class GroupingExpr {
    constructor(
        readonly expression: Expr,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitGroupingExpr(this);
    }

    sourceRange(): SourceRange {
        const start = (this.expression).sourceRange().start;
        const end = (this.expression).sourceRange().end;
        return new SourceRange(start, end);
    }
}

export class LiteralExpr {
    constructor(
        readonly value: LoxValue,
        readonly token: Token,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitLiteralExpr(this);
    }

    sourceRange(): SourceRange {
        const start = (this.token).sourceRange().start;
        const end = (this.token).sourceRange().end;
        return new SourceRange(start, end);
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

    sourceRange(): SourceRange {
        const start = (this.left).sourceRange().start;
        const end = (this.right).sourceRange().end;
        return new SourceRange(start, end);
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

    sourceRange(): SourceRange {
        const start = (this.object).sourceRange().start;
        const end = (this.value).sourceRange().end;
        return new SourceRange(start, end);
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

    sourceRange(): SourceRange {
        const start = (this.keyword).sourceRange().start;
        const end = (this.method).sourceRange().end;
        return new SourceRange(start, end);
    }
}

export class ThisExpr {
    constructor(
        readonly keyword: Token,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitThisExpr(this);
    }

    sourceRange(): SourceRange {
        const start = (this.keyword).sourceRange().start;
        const end = (this.keyword).sourceRange().end;
        return new SourceRange(start, end);
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

    sourceRange(): SourceRange {
        const start = (this.operator).sourceRange().start;
        const end = (this.right).sourceRange().end;
        return new SourceRange(start, end);
    }
}

export class VariableExpr {
    constructor(
        readonly name: Token,
    ) {}

    accept<R>(visitor: ExprVisitor<R>): R {
        return visitor.visitVariableExpr(this);
    }

    sourceRange(): SourceRange {
        const start = (this.name).sourceRange().start;
        const end = (this.name).sourceRange().end;
        return new SourceRange(start, end);
    }
}

export type Expr =
    ArrayExpr |
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
    visitArrayExpr(expr: ArrayExpr): R;
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
