import Lox from "./Lox";
import Token from "./Token";
import TokenType from "./TokenType";
import {
    Expr,
    BinaryExpr,
    GroupingExpr,
    LiteralExpr,
    UnaryExpr,
    VariableExpr,
    AssignExpr,
} from "./Expr";
import {
    Stmt,
    PrintStmt,
    ExpressionStmt,
    VarStmt,
} from "./Stmt";

type Associativity = "LEFT" | "RIGHT"

class OperatorLevel {
    constructor(
        readonly associativity: Associativity,
        readonly operators: TokenType[],
    ) {
        this.associativity = associativity;
        this.operators = operators;
    }
}

const operatorPrecedence: OperatorLevel[] = [
    new OperatorLevel("LEFT", [
        TokenType.BangEqual,
        TokenType.EqualEqual,
    ]),
    new OperatorLevel("LEFT", [
        TokenType.Greater,
        TokenType.GreaterEqual,
        TokenType.Less,
        TokenType.LessEqual,
    ]),
    new OperatorLevel("LEFT", [
        TokenType.Plus,
        TokenType.Minus,
    ]),
    new OperatorLevel("LEFT", [
        TokenType.Slash,
        TokenType.Star,
    ]),
];

class ParseError extends Error {}

export default class Parser {
    private current = 0

    constructor(private readonly lox: Lox, private readonly tokens: Token[]) {
        this.lox = lox;
        this.tokens = tokens;
    }

    parse(): Stmt[] {
        const statements: Stmt[] = [];
        while (!this.isAtEnd()) {
            const declaration = this.declaration();
            if (declaration !== null) statements.push(declaration);
        }

        return statements;
    }

    private declaration(): Stmt | null {
        try {
            if (this.match(TokenType.Var)) return this.varDeclaration();

            return this.statement();
        } catch (error) {
            if (error instanceof ParseError) {
                this.synchronize();
                return null;
            }
            throw error;
        }
    }

    private statement(): Stmt {
        if (this.match(TokenType.Print)) return this.printStatement();

        return this.expressionStatement();
    }

    private printStatement(): Stmt {
        const value = this.expression();
        this.consume(TokenType.Semicolon, "Expect ';' after value.");
        return new PrintStmt(value);
    }

    private varDeclaration(): Stmt {
        const name =
            this.consume(TokenType.Identifier, "Expect variable name.");

        const initializer =
            this.match(TokenType.Equal) ? this.expression() : null;

        this.consume(
            TokenType.Semicolon, "Expect ';' after variable declaration");

        return new VarStmt(name, initializer);
    }

    private expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume(TokenType.Semicolon, "Expect ';' after expression.");
        return new ExpressionStmt(expr);
    }

    private expression(): Expr {
        return this.assignment();
    }

    private assignment(): Expr {
        const expr = this.binary();

        if (this.match(TokenType.Equal)) {
            const equals = this.previous();
            const value = this.assignment();

            if (expr instanceof VariableExpr) {
                return new AssignExpr(expr.name, value);
            }

            // Report a parse error, but don't throw it, as we do not
            // need to synchronize her
            this.parseError(equals, "Invalid assignment target.");
        }

        return expr;
    }

    private binary(precedence = 0): Expr {
        const operatorLevel = operatorPrecedence[precedence];

        if (!operatorLevel) {
            return this.unary();
        }

        let expr = this.binary(precedence + 1);

        while (this.match(...operatorLevel.operators)) {
            const operator = this.previous();

            const rightPrecedence =
                operatorLevel.associativity === "LEFT"
                    ? precedence + 1
                    : precedence;

            const right = this.binary(rightPrecedence);

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

        if (this.match(TokenType.Identifier)) {
            return new VariableExpr(this.previous());
        }

        if (this.match(TokenType.LeftParen)) {
            const expr = this.expression();
            this.consume(TokenType.RightParen, "Expect ')' after expression.");
            return new GroupingExpr(expr);
        }

        throw this.parseError(this.peek(), "Expect expression.");
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();

        throw this.parseError(this.peek(), message);
    }

    private parseError(token: Token, message: string): ParseError {
        this.lox.error(token, message);
        return new ParseError(message);
    }

    private synchronize(): void {
        this.advance();

        while (!this.isAtEnd()) {
            if (this.previous().type === TokenType.Semicolon) return;

            switch (this.peek().type) {
                case TokenType.Class:
                case TokenType.Fun:
                case TokenType.Var:
                case TokenType.For:
                case TokenType.If:
                case TokenType.While:
                case TokenType.Print:
                case TokenType.Return:
                    return;
            }

            this.advance();
        }
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