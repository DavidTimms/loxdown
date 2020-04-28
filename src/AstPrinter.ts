import {
    Expr,
    BinaryExpr,
    GroupingExpr,
    LiteralExpr,
    UnaryExpr,
    ExprVisitor,
    VariableExpr,
} from "./Expr";

// Creates an unambiguous, if ugly, string representation of AST nodes
export default class AstPrinter implements ExprVisitor<string> {
    print(expr: Expr): string {
        return expr.accept(this);
    }

    visitBinaryExpr(expr: BinaryExpr): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }

    visitGroupingExpr(expr: GroupingExpr): string {
        return this.parenthesize("group", expr.expression);
    }

    visitLiteralExpr(expr: LiteralExpr): string {
        if (expr.value === null) return "nil";
        return `${expr.value}`;
    }

    visitUnaryExpr(expr: UnaryExpr): string {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }

    visitVariableExpr(expr: VariableExpr): string {
        return expr.name.lexeme;
    }

    private parenthesize(name: string, ...exprs: Expr[]): string {
        const exprStrings = exprs.map(expr => expr.accept(this));
        return `(${name} ${exprStrings.join(" ")})`;
    }
}
