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
    ThisExpr,
    SuperExpr,
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
import LoxValue from "./LoxValue";

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
        "OR",
    ]),
    new OperatorLevel(LogicalExpr, "LEFT", [
        "AND",
    ]),
    new OperatorLevel(BinaryExpr, "LEFT", [
        "BANG_EQUAL",
        "EQUAL_EQUAL",
    ]),
    new OperatorLevel(BinaryExpr, "LEFT", [
        "GREATER",
        "GREATER_EQUAL",
        "LESS",
        "LESS_EQUAL",
    ]),
    new OperatorLevel(BinaryExpr, "LEFT", [
        "PLUS",
        "MINUS",
    ]),
    new OperatorLevel(BinaryExpr, "LEFT", [
        "SLASH",
        "STAR",
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
            if (this.match("CLASS")) return this.classDeclaration();
            if (this.match("FUN")) return this.func("function");
            if (this.match("VAR")) return this.varDeclaration();

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
        const name = this.consume("IDENTIFIER", "Expect class name.");

        let superclass = null;
        if (this.match("LESS")) {
            this.consume("IDENTIFIER", "Expect superclass name.");
            superclass = new VariableExpr(this.previous());
        }

        this.consume("LEFT_BRACE", "expect '{' before class body.");

        const methods: FunctionStmt[] = [];

        while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
            methods.push(this.func("method"));
        }

        this.consume("RIGHT_BRACE", "Expect '}' after class body.");

        return new ClassStmt(name, superclass, methods);
    }

    private statement(): Stmt {
        if (this.match("FOR")) return this.forStatement();
        if (this.match("IF")) return this.ifStatement();
        if (this.match("PRINT")) return this.printStatement();
        if (this.match("RETURN")) return this.returnStatement();
        if (this.match("WHILE")) return this.whileStatement();
        if (this.match("LEFT_BRACE")) return new BlockStmt(this.block());

        return this.expressionStatement();
    }

    private forStatement(): Stmt {
        this.consume("LEFT_PAREN", "Expect '(' after 'for'.");

        let initializer: Stmt | null;

        if (this.match("SEMICOLON")) {
            initializer = null;
        } else if (this.match("VAR")) {
            initializer = this.varDeclaration();
        } else {
            initializer = this.expressionStatement();
        }

        let condition = this.check("SEMICOLON") ? null : this.expression();
        this.consume("SEMICOLON", "Expect ';' after loop condition.");

        const increment = this.check("RIGHT_PAREN") ? null : this.expression();
        this.consume("RIGHT_PAREN", "Expect ')' after for clauses.");

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
        this.consume("LEFT_PAREN", "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume("RIGHT_PAREN", "Exepct ')' after if condition.");

        const thenBranch = this.statement();
        const elseBranch = this.match("ELSE") ? this.statement() : null;

        return new IfStmt(condition, thenBranch, elseBranch);
    }

    private printStatement(): Stmt {
        const value = this.expression();
        this.consume("SEMICOLON", "Expect ';' after value.");
        return new PrintStmt(value);
    }

    private returnStatement(): Stmt {
        const keyword = this.previous();
        const value = this.check("SEMICOLON") ? null : this.expression();

        this.consume("SEMICOLON", "Expect ';' after value.");
        return new ReturnStmt(keyword, value);
    }

    private varDeclaration(): Stmt {
        const name = this.consume("IDENTIFIER", "Expect variable name.");

        const initializer = this.match("EQUAL") ? this.expression() : null;

        this.consume("SEMICOLON", "Expect ';' after variable declaration");

        return new VarStmt(name, initializer);
    }

    private whileStatement(): Stmt {
        this.consume("LEFT_PAREN", "Expect '(' after 'while'.");
        const condition = this.expression();
        this.consume("RIGHT_PAREN", "Expect '(' after condition");
        const body = this.statement();

        return new WhileStmt(condition, body);
    }

    private expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume("SEMICOLON", "Expect ';' after expression.");
        return new ExpressionStmt(expr);
    }

    private func(kind: string): FunctionStmt {
        const name = this.consume("IDENTIFIER", `Expect ${kind} name.`);
        this.consume("LEFT_PAREN", `Expect '(' after ${kind} name.`);

        const parameters = [];

        if (!this.check("RIGHT_PAREN")) {
            do {
                if (parameters.length >= 255) {
                    this.lox.error(
                        this.peek(),
                        "Cannot have more than 255 parameters.",
                    );
                }

                parameters.push(this.consume(
                    "IDENTIFIER", "Expect parameter name."));
            } while (this.match("COMMA"));
        }

        this.consume("RIGHT_PAREN", "Expect ')' after parameters.");
        this.consume("LEFT_BRACE", `Expect '{' before ${kind} body.`);

        const body = this.block();

        return new FunctionStmt(name, parameters, body);
    }

    private block(): Stmt[] {
        const statements: Stmt[] = [];

        while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
            const stmt = this.declaration();
            if (stmt) statements.push(stmt);
        }

        this.consume("RIGHT_BRACE", "Expect '}' after block.");
        return statements;
    }

    private expression(): Expr {
        return this.assignment();
    }

    private assignment(): Expr {
        const expr = this.binary();

        if (this.match("EQUAL")) {
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
        if (this.match("BANG", "MINUS")) {
            const operator = this.previous();
            const right = this.unary();
            return new UnaryExpr(operator, right);
        }
        return this.call();
    }

    private call(): Expr {
        let expr = this.primary();

        for (;;) {
            if (this.match("LEFT_PAREN")) {
                expr = this.finishCall(expr);
            } else if (this.match("DOT")) {
                const name = this.consume(
                    "IDENTIFIER",
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

        if (!this.check("RIGHT_PAREN")) {
            do {
                if (args.length >= 255) {
                    this.lox.error(
                        this.peek(),
                        "Cannot have more than 255 arguments.",
                    );
                }
                args.push(this.expression());
            } while (this.match("COMMA"));
        }

        const paren =
            this.consume("RIGHT_PAREN", "Expect ')' after arguments.");

        return new CallExpr(callee, paren, args);
    }

    private primary(): Expr {
        if (this.match("FALSE")) return new LiteralExpr(false);
        if (this.match("TRUE")) return new LiteralExpr(true);

        if (this.match("NIL", "NUMBER", "STRING")) {
            return new LiteralExpr(this.previous().literal as LoxValue);
        }

        if (this.match("SUPER")) {
            const keyword = this.previous();
            this.consume("DOT", "Expect '.' after 'super'.");
            const method = this.consume(
                "IDENTIFIER", "Expect superclass method name.");

            return new SuperExpr(keyword, method);
        }

        if (this.match("THIS")) return new ThisExpr(this.previous());

        if (this.match("IDENTIFIER")) {
            return new VariableExpr(this.previous());
        }

        if (this.match("LEFT_PAREN")) {
            const expr = this.expression();
            this.consume("RIGHT_PAREN", "Expect ')' after expression.");
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
            if (this.previous().type === "SEMICOLON") return;

            switch (this.peek().type) {
                case "CLASS":
                case "FUN":
                case "VAR":
                case "FOR":
                case "IF":
                case "WHILE":
                case "PRINT":
                case "RETURN":
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
        return this.peek().type === "EOF";
    }

    private peek(): Token {
        return this.tokens[this.current];
    }

    private previous(): Token {
        return this.tokens[this.current - 1];
    }
}