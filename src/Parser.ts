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
    LogicalExpr,
    CallExpr,
    GetExpr,
    SetExpr,
} from "./Expr";
import {
    Stmt,
    PrintStmt,
    ExpressionStmt,
    VarStmt,
    BlockStmt,
    IfStmt,
    WhileStmt,
    FunctionStmt,
    ReturnStmt,
    ClassStmt,
} from "./Stmt";

type Associativity = "LEFT" | "RIGHT";

class OperatorLevel {
    constructor(
        readonly exprType: typeof LogicalExpr | typeof BinaryExpr,
        readonly associativity: Associativity,
        readonly operators: TokenType[],
    ) {
        this.associativity = associativity;
        this.operators = operators;
    }
}

const operatorPrecedence: OperatorLevel[] = [
    new OperatorLevel(LogicalExpr, "LEFT", [
        TokenType.Or,
    ]),
    new OperatorLevel(LogicalExpr, "LEFT", [
        TokenType.And,
    ]),
    new OperatorLevel(BinaryExpr, "LEFT", [
        TokenType.BangEqual,
        TokenType.EqualEqual,
    ]),
    new OperatorLevel(BinaryExpr, "LEFT", [
        TokenType.Greater,
        TokenType.GreaterEqual,
        TokenType.Less,
        TokenType.LessEqual,
    ]),
    new OperatorLevel(BinaryExpr, "LEFT", [
        TokenType.Plus,
        TokenType.Minus,
    ]),
    new OperatorLevel(BinaryExpr, "LEFT", [
        TokenType.Slash,
        TokenType.Star,
    ]),
];

class ParseError extends Error {}

export default class Parser {
    private current = 0;

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
            if (this.match(TokenType.Class)) return this.classDeclaration();
            if (this.match(TokenType.Fun)) return this.func("function");
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

    private classDeclaration(): Stmt {
        const name = this.consume(TokenType.Identifier, "Expect class name.");
        this.consume(TokenType.LeftBrace, "expect '{' before class body.");

        const methods: FunctionStmt[] = [];

        while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
            methods.push(this.func("method"));
        }

        this.consume(TokenType.RightBrace, "Expect '}' after class body.");

        return new ClassStmt(name, methods);
    }

    private statement(): Stmt {
        if (this.match(TokenType.For)) return this.forStatement();
        if (this.match(TokenType.If)) return this.ifStatement();
        if (this.match(TokenType.Print)) return this.printStatement();
        if (this.match(TokenType.Return)) return this.returnStatement();
        if (this.match(TokenType.While)) return this.whileStatement();
        if (this.match(TokenType.LeftBrace)) return new BlockStmt(this.block());

        return this.expressionStatement();
    }

    private forStatement(): Stmt {
        this.consume(TokenType.LeftParen, "Expect '(' after 'for'.");

        let initializer: Stmt | null;

        if (this.match(TokenType.Semicolon)) {
            initializer = null;
        } else if (this.match(TokenType.Var)) {
            initializer = this.varDeclaration();
        } else {
            initializer = this.expressionStatement();
        }

        let condition =
            this.check(TokenType.Semicolon) ? null : this.expression();
        this.consume(TokenType.Semicolon, "Expect ';' after loop condition.");

        const increment  =
            this.check(TokenType.RightParen) ? null : this.expression();
        this.consume(TokenType.RightParen, "Expect ')' after for clauses.");

        let body = this.statement();

        // Desugar "for" loop into a "while" loop

        if (increment !== null) {
            body = new BlockStmt([
                body,
                new ExpressionStmt(increment),
            ]);
        }

        if (condition === null) condition = new LiteralExpr(true);
        body = new WhileStmt(condition, body);

        if (initializer !== null) {
            body = new BlockStmt([initializer, body]);
        }

        return body;
    }

    private ifStatement(): Stmt {
        this.consume(TokenType.LeftParen, "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume(TokenType.RightParen, "Exepct ')' after if condition.");

        const thenBranch = this.statement();
        const elseBranch = this.match(TokenType.Else) ? this.statement() : null;

        return new IfStmt(condition, thenBranch, elseBranch);
    }

    private printStatement(): Stmt {
        const value = this.expression();
        this.consume(TokenType.Semicolon, "Expect ';' after value.");
        return new PrintStmt(value);
    }

    private returnStatement(): Stmt {
        const keyword = this.previous();
        const value =
            this.check(TokenType.Semicolon) ? null : this.expression();

        this.consume(TokenType.Semicolon, "Expect ';' after value.");
        return new ReturnStmt(keyword, value);
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

    private whileStatement(): Stmt {
        this.consume(TokenType.LeftParen, "Expect '(' after 'while'.");
        const condition = this.expression();
        this.consume(TokenType.RightParen, "Expect '(' after condition");
        const body = this.statement();

        return new WhileStmt(condition, body);
    }

    private expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume(TokenType.Semicolon, "Expect ';' after expression.");
        return new ExpressionStmt(expr);
    }

    private func(kind: string): FunctionStmt {
        const name = this.consume(TokenType.Identifier, `Expect ${kind} name.`);
        this.consume(TokenType.LeftParen, `Expect '(' after ${kind} name.`);

        const parameters = [];

        if (!this.check(TokenType.RightParen)) {
            do {
                if (parameters.length >= 255) {
                    this.lox.error(
                        this.peek(),
                        "Cannot have more than 255 parameters.",
                    );
                }

                parameters.push(this.consume(
                    TokenType.Identifier, "Expect parameter name."));
            } while (this.match(TokenType.Comma));
        }

        this.consume(TokenType.RightParen, "Expect ')' after parameters.");
        this.consume(TokenType.LeftBrace, `Expect '{' before ${kind} body.`);

        const body = this.block();

        return new FunctionStmt(name, parameters, body);
    }

    private block(): Stmt[] {
        const statements: Stmt[] = [];

        while (!this.check(TokenType.RightBrace) && !this.isAtEnd()) {
            const stmt = this.declaration();
            if (stmt) statements.push(stmt);
        }

        this.consume(TokenType.RightBrace, "Expect '}' after block.");
        return statements;
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
            } else if (expr instanceof GetExpr) {
                return new SetExpr(expr.object, expr.name, value);
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

            expr = new operatorLevel.exprType(expr, operator, right);
        }

        return expr;
    }

    private unary(): Expr {
        if (this.match(TokenType.Bang, TokenType.Minus)) {
            const operator = this.previous();
            const right = this.unary();
            return new UnaryExpr(operator, right);
        }
        return this.call();
    }

    private call(): Expr {
        let expr = this.primary();

        for (;;) {
            if (this.match(TokenType.LeftParen)) {
                expr = this.finishCall(expr);
            } else if (this.match(TokenType.Dot)) {
                const name = this.consume(
                    TokenType.Identifier,
                    "Expect property name after '.'.",
                );
                expr = new GetExpr(expr, name);
            } else {
                break;
            }
        }

        return expr;
    }

    private finishCall(callee: Expr): Expr {
        const args: Expr[] = [];

        if (!this.check(TokenType.RightParen)) {
            do {
                if (args.length >= 255) {
                    this.lox.error(
                        this.peek(),
                        "Cannot have more than 255 arguments.",
                    );
                }
                args.push(this.expression());
            } while (this.match(TokenType.Comma));
        }

        const paren =
            this.consume(TokenType.RightParen, "Expect ')' after arguments.");

        return new CallExpr(callee, paren, args);
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