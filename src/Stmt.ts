// This file is programatically generated. Do not edit it directly.

import Token from "./Token";
import VariableExpr from "./VariableExpr";
import Field from "./Field";
import Expr from "./Expr";
import Parameter from "./Parameter";
import TypeExpr from "./TypeExpr";

export class BlockStmt {
    constructor(
        readonly statements: Stmt[],
    ) {}

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitBlockStmt(this);
    }
}

export class ClassStmt {
    constructor(
        readonly name: Token,
        readonly superclass: VariableExpr | null,
        readonly fields: Field[],
        readonly methods: FunctionStmt[],
    ) {}

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitClassStmt(this);
    }
}

export class ExpressionStmt {
    constructor(
        readonly expression: Expr,
    ) {}

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitExpressionStmt(this);
    }
}

export class FunctionStmt {
    constructor(
        readonly name: Token,
        readonly params: Parameter[],
        readonly returnType: TypeExpr | null,
        readonly body: Stmt[],
    ) {}

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitFunctionStmt(this);
    }
}

export class IfStmt {
    constructor(
        readonly condition: Expr,
        readonly thenBranch: Stmt,
        readonly elseBranch: Stmt | null,
    ) {}

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitIfStmt(this);
    }
}

export class PrintStmt {
    constructor(
        readonly expression: Expr,
    ) {}

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitPrintStmt(this);
    }
}

export class ReturnStmt {
    constructor(
        readonly keyword: Token,
        readonly value: Expr | null,
    ) {}

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitReturnStmt(this);
    }
}

export class TypeStmt {
    constructor(
        readonly name: Token,
        readonly type: TypeExpr,
    ) {}

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitTypeStmt(this);
    }
}

export class VarStmt {
    constructor(
        readonly name: Token,
        readonly type: TypeExpr | null,
        readonly initializer: Expr | null,
    ) {}

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitVarStmt(this);
    }
}

export class WhileStmt {
    constructor(
        readonly condition: Expr,
        readonly body: Stmt,
    ) {}

    accept<R>(visitor: StmtVisitor<R>): R {
        return visitor.visitWhileStmt(this);
    }
}

export type Stmt =
    BlockStmt |
    ClassStmt |
    ExpressionStmt |
    FunctionStmt |
    IfStmt |
    PrintStmt |
    ReturnStmt |
    TypeStmt |
    VarStmt |
    WhileStmt;

export default Stmt;

export interface StmtVisitor<R> {
    visitBlockStmt(stmt: BlockStmt): R;
    visitClassStmt(stmt: ClassStmt): R;
    visitExpressionStmt(stmt: ExpressionStmt): R;
    visitFunctionStmt(stmt: FunctionStmt): R;
    visitIfStmt(stmt: IfStmt): R;
    visitPrintStmt(stmt: PrintStmt): R;
    visitReturnStmt(stmt: ReturnStmt): R;
    visitTypeStmt(stmt: TypeStmt): R;
    visitVarStmt(stmt: VarStmt): R;
    visitWhileStmt(stmt: WhileStmt): R;
}
