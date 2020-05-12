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
    SetExpr,
    GetExpr,
} from "./Expr";

// Creates an unambiguous, if ugly, string representation of AST nodes
export default class AstPrinter implements ExprVisitor<string> {
    print(expr: Expr): string {
        return expr.accept(this);
    }

    visitAssignExpr(expr: AssignExpr): string {
        return this.parenthesize("=", expr.name.lexeme, expr.value);
    }

    visitBinaryExpr(expr: BinaryExpr): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }

    visitCallExpr(expr: CallExpr): string {
        return this.parenthesize(expr.callee, ...expr.args);
    }

    visitGetExpr(expr: GetExpr): string {
        return this.parenthesize(".", expr.object, expr.name.lexeme);
    }

    visitGroupingExpr(expr: GroupingExpr): string {
        return this.parenthesize("group", expr.expression);
    }

    visitLiteralExpr(expr: LiteralExpr): string {
        if (expr.value === null) return "nil";
        return `${expr.value}`;
    }

    visitLogicalExpr(expr: LogicalExpr): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }

    visitSetExpr(expr: SetExpr): string {
        return this.parenthesize(
            "=", expr.object, expr.name.lexeme, expr.value);
    }

    visitUnaryExpr(expr: UnaryExpr): string {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }

    visitVariableExpr(expr: VariableExpr): string {
        return expr.name.lexeme;
    }

    private parenthesize(...args: (Expr | string)[]): string {
        const argStrings = args.map(arg =>
            arg instanceof Expr ? arg.accept(this) : arg);
        return `(${argStrings.join(" ")})`;
    }
}
