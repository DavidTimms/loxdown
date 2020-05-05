import Lox from "./Lox";
import LoxValue from "./LoxValue";
import TokenType from "./TokenType";
import Token from "./Token";
import Environment from "./Environment";
import RuntimeError from "./RuntimeError";
import {
    Expr,
    BinaryExpr,
    GroupingExpr,
    LiteralExpr,
    UnaryExpr,
    ExprVisitor,
    VariableExpr,
    AssignExpr,
    LogicalExpr,
    CallExpr,
} from "./Expr";
import {
    Stmt,
    StmtVisitor,
    ExpressionStmt,
    PrintStmt,
    VarStmt,
    BlockStmt,
    IfStmt,
    WhileStmt,
    FunctionStmt,
} from "./Stmt";
import {isLoxCallable} from "./LoxCallable";
import NativeFunction from "./NativeFunction";
import LoxFunction from "./LoxFunction";

export default class Interpreter
implements ExprVisitor<LoxValue>, StmtVisitor<void> {
    readonly globals: Environment = new Environment();
    private environment = this.globals;

    constructor(private readonly lox: Lox) {
        this.lox = lox;

        // TODO move native functions to a separate module if we define
        // more of them
        this.globals.define("clock", new NativeFunction(() => Date.now()));
    }

    interpret(statements: Stmt[]): void {
        try {
            for (const statement of statements) {
                this.execute(statement);
            }
        } catch (error) {
            if (error instanceof RuntimeError) {
                this.lox.runtimeError(error);
            } else throw error;
        }
    }

    private evaluate(expr: Expr): LoxValue {
        return expr.accept(this);
    }

    private execute(stmt: Stmt): void {
        stmt.accept(this);
    }

    executeBlock(statements: Stmt[], environment: Environment): void {
        const previous = this.environment;
        try {
            this.environment = environment;

            for (const statement of statements) {
                this.execute(statement);
            }
        } finally {
            this.environment = previous;
        }
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.executeBlock(stmt.statements, new Environment(this.environment));
    }

    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.evaluate(stmt.expression);
    }

    visitFunctionStmt(stmt: FunctionStmt): void {
        this.environment.define(stmt.name.lexeme, new LoxFunction(stmt));
    }

    visitIfStmt(stmt: IfStmt): void {
        if (this.isTruthy(this.evaluate(stmt.condition))) {
            this.execute(stmt.thenBranch);
        } else if (stmt.elseBranch) {
            this.execute(stmt.elseBranch);
        }
    }

    visitPrintStmt(stmt: PrintStmt): void {
        const value = this.evaluate(stmt.expression);
        this.lox.print(this.stringify(value));
    }

    visitVarStmt(stmt: VarStmt): void {
        const value = stmt.initializer ? this.evaluate(stmt.initializer) : null;
        this.environment.define(stmt.name.lexeme, value);
    }

    visitWhileStmt(stmt: WhileStmt): void {
        while (this.isTruthy(this.evaluate(stmt.condtion))) {
            this.execute(stmt.body);
        }
    }

    visitAssignExpr(expr: AssignExpr): LoxValue {
        const value = this.evaluate(expr.value);
        this.environment.assign(expr.name, value);
        return value;
    }

    visitLiteralExpr(expr: LiteralExpr): LoxValue {
        return expr.value;
    }

    visitLogicalExpr(expr: LogicalExpr): LoxValue {
        const left = this.evaluate(expr.left);

        switch (expr.operator.type) {
            case TokenType.Or:
                if (this.isTruthy(left)) return left;
                break;
            case TokenType.And:
                if (!this.isTruthy(left)) return left;
                break;
            default:
                // Unreachable
                throw new Error(
                    `Unexpected logical operator: ${expr.operator.lexeme}`);
        }
        return this.evaluate(expr.right);
    }

    visitGroupingExpr(expr: GroupingExpr): LoxValue {
        return this.evaluate(expr.expression);
    }

    visitUnaryExpr(expr: UnaryExpr): LoxValue {
        const right = this.evaluate(expr.right);

        // TODO add specific UnaryOperator type to detech totality
        switch (expr.operator.type) {
            case TokenType.Bang:
                return !this.isTruthy(right);
            case TokenType.Minus:
                this.checkNumberOperand(expr.operator, right);
                return -(right as number);
        }

        // Unreachable
        throw new Error(`Unexpected unary operator: ${expr.operator.lexeme}`);
    }

    visitVariableExpr(expr: VariableExpr): LoxValue {
        return this.environment.get(expr.name);
    }

    visitBinaryExpr(expr: BinaryExpr): LoxValue {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
            case TokenType.Plus:
                if (typeof left === "number" && typeof right === "number") {
                    return left + right;
                }

                if (typeof left === "string" && typeof right === "string") {
                    return left + right;
                }
                throw new RuntimeError(
                    expr.operator,
                    "Operands must be two numbers or two strings.",
                );
            case TokenType.Minus:
                this.checkNumberOperands(expr.operator, left, right);
                return (left as number) - (right as number);
            case TokenType.Slash:
                this.checkNumberOperands(expr.operator, left, right);
                return (left as number) / (right as number);
            case TokenType.Star:
                this.checkNumberOperands(expr.operator, left, right);
                return (left as number) * (right as number);
            case TokenType.Greater:
                this.checkNumberOperands(expr.operator, left, right);
                return (left as number) > (right as number);
            case TokenType.GreaterEqual:
                this.checkNumberOperands(expr.operator, left, right);
                return (left as number) >= (right as number);
            case TokenType.Less:
                this.checkNumberOperands(expr.operator, left, right);
                return (left as number) < (right as number);
            case TokenType.LessEqual:
                this.checkNumberOperands(expr.operator, left, right);
                return (left as number) <= (right as number);
            case TokenType.EqualEqual:
                return this.isEqual(left, right);
            case TokenType.BangEqual:
                return !this.isEqual(left, right);
        }

        // Unreachable
        throw new Error(`Unexpected binary operator: ${expr.operator.lexeme}`);
    }

    visitCallExpr(expr: CallExpr): LoxValue {
        const callee = this.evaluate(expr.callee);
        const args = expr.args.map(arg => this.evaluate(arg));

        if (!isLoxCallable(callee)) {
            throw new RuntimeError(
                expr.paren,
                "Can only call functions and classes.",
            );
        }

        if (args.length !== callee.arity()) {
            throw new RuntimeError(
                expr.paren,
                `Expected ${callee.arity()} arguments but got ${args.length}.`,
            );
        }

        return callee.call(this, args);
    }

    private isEqual(left: LoxValue, right: LoxValue): boolean {
        return left === right;
    }

    private isTruthy(object: LoxValue): boolean {
        return object !== null && object !== false;
    }

    private checkNumberOperand(
        operator: Token,
        operand: LoxValue,
    ): operand is number {
        if (typeof operand === "number") return true;
        throw new RuntimeError(operator, "Operand must be a number.");
    }

    private checkNumberOperands(
        operator: Token,
        left: LoxValue,
        right: LoxValue,
    ): void {
        if (typeof left === "number" && typeof right === "number") return;
        throw new RuntimeError(operator, "Operands must be numbers.");
    }

    private stringify(object: LoxValue): string {
        if (object === null) return "nil";
        return String(object);
    }
}
