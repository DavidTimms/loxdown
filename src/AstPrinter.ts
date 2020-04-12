import * as Expr from "./Expr";

// Creates an unambiguous, if ugly, string representation of AST nodes
export default class AstPrinter implements Expr.Visitor<string> {
    print(expr: Expr.Expr): string {
        return expr.accept(this);
    }

    visitBinaryExpr(expr: Expr.Binary): string {
        return this.parenthesize(expr.operator.lexeme, expr.left, expr.right);
    }

    visitGroupingExpr(expr: Expr.Grouping): string {
        return this.parenthesize("group", expr.expression);
    }

    visitLiteralExpr(expr: Expr.Literal): string {
        if (expr.value === null) return "nil";
        return `${expr.value}`;
    }

    visitUnaryExpr(expr: Expr.Unary): string {
        return this.parenthesize(expr.operator.lexeme, expr.right);
    }

    private parenthesize(name: string, ...exprs: Expr.Expr[]): string {
        const exprStrings = exprs.map(expr => expr.accept(this));
        return `(${name} ${exprStrings.join(" ")})`;
    }
}
