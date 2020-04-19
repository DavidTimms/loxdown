import {
    Expr,
    BinaryExpr,
    GroupingExpr,
    LiteralExpr,
    UnaryExpr,
    ExprVisitor,
} from "./Expr";
import LoxValue from "./LoxValue";
import TokenType from "./TokenType";
import Token from "./Token";
import RuntimeError from "./RuntimeError";

export default class Interpreter implements ExprVisitor<LoxValue> {

    evaluate(expr: Expr): LoxValue {
        return expr.accept(this);
    }

    visitLiteralExpr(expr: LiteralExpr): LoxValue {
        return expr.value;
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
}
