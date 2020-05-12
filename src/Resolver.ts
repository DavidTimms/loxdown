import {Expr, ExprVisitor, VariableExpr, AssignExpr, BinaryExpr, CallExpr, GroupingExpr, LiteralExpr, LogicalExpr, UnaryExpr, GetExpr, SetExpr} from "./Expr";
import {Stmt, StmtVisitor, BlockStmt, VarStmt, FunctionStmt, ExpressionStmt, IfStmt, WhileStmt, ReturnStmt, PrintStmt, ClassStmt} from "./Stmt";
import Interpreter from "./Interpreter";
import Token from "./Token";
import Lox from "./Lox";

type AstNode = Stmt | Expr;

type FunctionType = "NONE" | "FUNCTION";

export default class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
    private readonly scopes: Map<string, boolean>[] = [];
    private currentFunction: FunctionType = "NONE";

    constructor(
        private readonly lox: Lox,
        private readonly interpreter: Interpreter,
    ) {
        this.interpreter = interpreter;
    }

    resolveAll(nodes: AstNode[]): void {
        for (const node of nodes) {
            this.resolve(node);
        }
    }

    private resolve(node: AstNode): void {
        // This wierd typecast is needed to get round the type checker's
        // inability to know this call is valid
        (node as {accept: Function}).accept(this);
    }

    private resolveFunction(func: FunctionStmt, type: FunctionType): void {
        const enclosingFunction = this.currentFunction;
        this.currentFunction = type;

        this.beginScope();
        for (const param of func.params) {
            this.declare(param);
            this.define(param);
        }
        this.resolveAll(func.body);
        this.endScope();
        this.currentFunction = enclosingFunction;
    }

    private beginScope(): void {
        this.scopes.unshift(new Map());
    }

    private endScope(): void {
        this.scopes.shift();
    }

    private declare(name: Token): void {
        if (this.scopes.length === 0) return;
        const scope = this.scopes[0];

        if (scope.has(name.lexeme)) {
            this.lox.error(
                name,
                "Variable with this name already declared in this scope.",
            );
        }

        scope.set(name.lexeme, false);
    }

    private define(name: Token): void {
        if (this.scopes.length === 0) return;
        this.scopes[0].set(name.lexeme, true);
    }

    private resolveLocal(expr: Expr, name: Token): void {
        for (const [i, scope] of this.scopes.entries()) {
            if (scope.has(name.lexeme)) {
                this.interpreter.resolve(expr, i);
                return;
            }
        }

        // Not found. Assume it is global.
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.beginScope();
        this.resolveAll(stmt.statements);
        this.endScope();
    }

    visitClassStmt(stmt: ClassStmt): void {
        this.declare(stmt.name);
        this.define(stmt.name);
    }

    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.resolve(stmt.expression);
    }

    visitFunctionStmt(stmt: FunctionStmt): void {
        this.declare(stmt.name);
        this.define(stmt.name);

        this.resolveFunction(stmt, "FUNCTION");
    }

    visitIfStmt(stmt: IfStmt): void {
        this.resolve(stmt.condition);
        this.resolve(stmt.thenBranch);
        if (stmt.elseBranch) this.resolve(stmt.elseBranch);
    }

    visitPrintStmt(stmt: PrintStmt): void {
        this.resolve(stmt.expression);
    }

    visitReturnStmt(stmt: ReturnStmt): void {
        if (this.currentFunction === "NONE") {
            this.lox.error(stmt.keyword, "Cannot return from top-level code.");
        }

        if (stmt.value) this.resolve(stmt.value);
    }

    visitVarStmt(stmt: VarStmt): void {
        this.declare(stmt.name);
        if (stmt.initializer !== null) {
            this.resolve(stmt.initializer);
        }
        this.define(stmt.name);
    }

    visitWhileStmt(stmt: WhileStmt): void {
        this.resolve(stmt.condition);
        this.resolve(stmt.body);
    }

    visitAssignExpr(expr: AssignExpr): void {
        this.resolve(expr.value);
        this.resolveLocal(expr, expr.name);
    }

    visitBinaryExpr(expr: BinaryExpr): void {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }

    visitCallExpr(expr: CallExpr): void {
        this.resolve(expr.callee);
        this.resolveAll(expr.args);
    }

    visitGetExpr(expr: GetExpr): void {
        this.resolve(expr.object);
    }

    visitGroupingExpr(expr: GroupingExpr): void {
        this.resolve(expr.expression);
    }

    visitLiteralExpr(expr: LiteralExpr): void {
        // Nothing to see here...
    }

    visitLogicalExpr(expr: LogicalExpr): void {
        this.resolve(expr.left);
        this.resolve(expr.right);
    }

    visitSetExpr(expr: SetExpr): void {
        this.resolve(expr.value);
        this.resolve(expr.object);
    }

    visitUnaryExpr(expr: UnaryExpr): void {
        this.resolve(expr.right);
    }

    visitVariableExpr(expr: VariableExpr): void {
        if (
            this.scopes.length > 0 &&
            this.scopes[0].get(expr.name.lexeme) === false
        ) {
            this.lox.error(
                expr.name,
                "Cannot read local variable in its own initializer.",
            );
        }
        this.resolveLocal(expr, expr.name);
    }
}
