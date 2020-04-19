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
                return -(right as number);
        }

        // Unreachable
        throw Error(`Unexpected unary operator: ${expr.operator.lexeme}`);
    }

    private isTruthy(object: LoxValue): boolean {
        return object !== null && object !== false;
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
                break;
            case TokenType.Minus:
                return (left as number) - (right as number);
            case TokenType.Slash:
                return (left as number) / (right as number);
            case TokenType.Star:
                return (left as number) * (right as number);
            case TokenType.Greater:
                return (left as number) > (right as number);
            case TokenType.GreaterEqual:
                return (left as number) >= (right as number);
            case TokenType.Less:
                return (left as number) < (right as number);
            case TokenType.LessEqual:
                return (left as number) <= (right as number);
            case TokenType.EqualEqual:
                return this.isEqual(left, right);
            case TokenType.BangEqual:
                return !this.isEqual(left, right);
        }

        // Unreachable
        throw Error(`Unexpected binary operator: ${expr.operator.lexeme}`);
    }

    private isEqual(left: LoxValue, right: LoxValue): boolean {
        return left === right;
    }
}
