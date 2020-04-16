import Token from "./Token";
import TokenType from "./TokenType";
import ErrorHandler from "./ErrorHandler";
import {
    Expr,
    BinaryExpr,
    GroupingExpr,
    LiteralExpr,
    UnaryExpr,
    ExprVisitor,
} from "./Expr";

class ParseError extends Error {}

export default class Parser {
    private current = 0

    constructor(private readonly tokens: Token[], public error: ErrorHandler) {
        this.tokens = tokens;
    }

    parse(): Expr {
        return this.expression();
    }

    private expression(): Expr {
        return this.equality();
    }

    private equality(): Expr {
        let expr = this.comparison();

        while (this.match(TokenType.BangEqual, TokenType.EqualEqual)) {
            const operator = this.previous();
            const right = this.comparison();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private comparison(): Expr {
        let expr = this.addition();

        while (this.match(
            TokenType.Greater,
            TokenType.GreaterEqual,
            TokenType.Less,
            TokenType.LessEqual,
        )) {
            const operator = this.previous();
            const right = this.addition();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private addition(): Expr {
        let expr = this.multiplication();

        while (this.match(TokenType.Plus, TokenType.Minus)) {
            const operator = this.previous();
            const right = this.multiplication();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private multiplication(): Expr {
        let expr = this.unary();

        while (this.match(TokenType.Slash, TokenType.Star)) {
            const operator = this.previous();
            const right = this.unary();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private unary(): Expr {
        if (this.match(TokenType.Bang, TokenType.Minus)) {
            const operator = this.previous();
            const right = this.unary();
            return new UnaryExpr(operator, right);
        }
        return this.primary();
    }

    private primary(): Expr {
        if (this.match(TokenType.False)) return new LiteralExpr(false);
        if (this.match(TokenType.True)) return new LiteralExpr(true);
        if (this.match(TokenType.Nil)) return new LiteralExpr(null);

        if (this.match(TokenType.Number, TokenType.String)) {
            return new LiteralExpr(this.previous().literal);
        }

        if (this.match(TokenType.LeftParen)) {
            const expr = this.expression();
            this.consume(TokenType.RightParen, "Expect ')' after expression.");
            return new GroupingExpr(expr);
        }
        throw this.parseError(this.peek(), "Unexpected token");
    }

    private consume(type: TokenType, message: string) {
        if (this.check(type)) return this.advance();

        throw this.parseError(this.peek(), message);
    }

    private parseError(token: Token, message: string): ParseError {
        this.error(token, message);
        return new ParseError();
    }

    private match(...types: TokenType[]): boolean {
        for (const type of types) {
            if (this.check(type)) {
                this.advance();
                return true;
            }
        }
        return false;
    }

    private check(type: TokenType): boolean {
        if (this.isAtEnd()) return false;
        return this.peek().type === type;
    }

    private advance(): Token {
        if (!this.isAtEnd()) this.current += 1;
        return this.previous();
    }

    private isAtEnd(): boolean {
        return this.peek().type === TokenType.EOF;
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }
}