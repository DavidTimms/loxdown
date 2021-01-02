// This file is programmatically generated. Do not edit it directly.

import Token from "./Token";
import GenericParameter from "./GenericParameter";
import SourceRange from "./SourceRange";

export class CallableTypeExpr {
    constructor(
        readonly fun: Token,
        readonly genericParams: GenericParameter[],
        readonly paramTypes: TypeExpr[],
        readonly closingParen: Token,
        readonly returnType: TypeExpr | null,
    ) {}

    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitCallableTypeExpr(this);
    }

    sourceRange(): SourceRange {
        const start = (this.fun).sourceRange().start;
        const end = (this.returnType ?? this.closingParen).sourceRange().end;
        return new SourceRange(start, end);
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

    sourceRange(): SourceRange {
        const start = (this.left).sourceRange().start;
        const end = (this.right).sourceRange().end;
        return new SourceRange(start, end);
    }
}

export class VariableTypeExpr {
    constructor(
        readonly name: Token,
    ) {}

    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitVariableTypeExpr(this);
    }

    sourceRange(): SourceRange {
        const start = (this.name).sourceRange().start;
        const end = (this.name).sourceRange().end;
        return new SourceRange(start, end);
    }
}

export class GenericTypeExpr {
    constructor(
        readonly name: Token,
        readonly genericArgs: TypeExpr[],
        readonly closingBracket: Token,
    ) {}

    accept<R>(visitor: TypeExprVisitor<R>): R {
        return visitor.visitGenericTypeExpr(this);
    }

    sourceRange(): SourceRange {
        const start = (this.name).sourceRange().start;
        const end = (this.closingBracket).sourceRange().end;
        return new SourceRange(start, end);
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
