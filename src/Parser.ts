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
    TypeStmt,
} from "./Stmt";
import LoxValue from "./LoxValue";
import { loxTrue, loxFalse } from "./LoxBool";
import Parameter from "./Parameter";
import {
    TypeExpr,
    VariableTypeExpr,
    CallableTypeExpr,
    UnionTypeExpr,
    GenericTypeExpr,
} from "./TypeExpr";
import Field from "./Field";
import SyntaxError from "./SyntaxError";
import SourceRange from "./SourceRange";
import GenericParameter from "./GenericParameter";

type Associativity = "LEFT" | "RIGHT";

class OperatorLevel {
    constructor(
        readonly exprType: typeof LogicalExpr | typeof BinaryExpr,
        readonly associativity: Associativity,
        readonly operators: TokenType[],
    ) {}
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

export default class Parser {
    private current = 0;
    private errors: SyntaxError[] = [];

    constructor(
        private readonly tokens: Token[],
    ) {}

    parse(): {statements: Stmt[]; errors: SyntaxError[]} {
        this.errors = [];
        const statements: Stmt[] = [];

        while (!this.isAtEnd()) {
            const declaration = this.declaration();
            if (declaration !== null) statements.push(declaration);
        }

        return {statements, errors: this.errors};
    }

    private declaration(): Stmt | null {
        try {
            if (this.match("CLASS")) return this.classDeclaration();
            if (this.match("FUN")) {
                const name =
                    this.consume("IDENTIFIER", "Expect function name.");
                return this.func("function", name);
            }
            if (this.match("TYPE")) return this.typeDeclaration();
            if (this.match("VAR")) return this.varDeclaration();

            return this.statement();
        } catch (error) {
            if (error instanceof SyntaxError) {
                this.synchronize();
                return null;
            }
            throw error;
        }
    }

    private classDeclaration(): Stmt {
        const name = this.consume("IDENTIFIER", "Expect class name.");

        const genericParams = this.genericParameters();

        let superclass = null;
        if (this.match("LESS")) {
            this.consume("IDENTIFIER", "Expect superclass name.");
            superclass = new VariableExpr(this.previous());
        }

        this.consume("LEFT_BRACE", "expect '{' before class body.");

        const fields: Field[] = [];
        const methods: FunctionStmt[] = [];

        while (!this.check("RIGHT_BRACE") && !this.isAtEnd()) {
            const name =
                this.consume("IDENTIFIER", "Expect field or method name.");

            if (this.check("COLON")) {
                fields.push(this.field(name));
            } else {
                methods.push(this.func("method", name));
            }
        }

        this.consume("RIGHT_BRACE", "Expect '}' after class body.");

        return new ClassStmt(name, genericParams, superclass, fields, methods);
    }

    private field(name: Token): Parameter {
        this.consume("COLON", "Expect ':' after field name.");
        const type = this.typeExpr();
        this.consume("SEMICOLON", "Expect ';' after field type.");
        return new Field(name, type);
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
        const postConditionSemicolon =
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

        if (condition === null) {
            condition = new LiteralExpr(loxTrue, postConditionSemicolon);
        }
        body = new WhileStmt(condition, body);

        if (initializer !== null) {
            body = new BlockStmt([initializer, body]);
        }

        return body;
    }

    private ifStatement(): Stmt {
        this.consume("LEFT_PAREN", "Expect '(' after 'if'.");
        const condition = this.expression();
        this.consume("RIGHT_PAREN", "Expect ')' after if condition.");

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

    private typeDeclaration(): Stmt {
        const name = this.consume("IDENTIFIER", "Expect type name.");

        const genericParams = this.genericParameters();

        this.consume("EQUAL", "Expect '=' after type name.");

        const type = this.typeExpr();

        this.consume("SEMICOLON", "Expect ';' after type declaration.");

        return new TypeStmt(name, genericParams, type);
    }

    private varDeclaration(): Stmt {
        const name = this.consume("IDENTIFIER", "Expect variable name.");

        const type = this.match("COLON") ? this.typeExpr() : null;

        const initializer = this.match("EQUAL") ? this.expression() : null;

        this.consume("SEMICOLON", "Expect ';' after variable declaration.");

        return new VarStmt(name, type, initializer);
    }

    private whileStatement(): Stmt {
        this.consume("LEFT_PAREN", "Expect '(' after 'while'.");
        const condition = this.expression();
        this.consume("RIGHT_PAREN", "Expect '(' after condition.");
        const body = this.statement();

        return new WhileStmt(condition, body);
    }

    private expressionStatement(): Stmt {
        const expr = this.expression();
        this.consume("SEMICOLON", "Expect ';' after expression.");
        return new ExpressionStmt(expr);
    }

    private func(kind: string, name: Token): FunctionStmt {
        const genericParams = this.genericParameters();

        const previousComponent =
            genericParams.length > 0 ? "generic parameters" : `${kind} name.`;

        this.consume("LEFT_PAREN", `Expect '(' after ${previousComponent}.`);

        const params: Parameter[] = [];

        if (!this.check("RIGHT_PAREN")) {
            do {
                if (params.length >= 255) {
                    this.error(
                        "Cannot have more than 255 parameters.",
                        this.peek(),
                    );
                }

                params.push(this.parameter());
            } while (this.match("COMMA"));
        }

        this.consume("RIGHT_PAREN", "Expect ')' after parameters.");

        const returnType = this.match("COLON") ? this.typeExpr() : null;

        this.consume("LEFT_BRACE", `Expect '{' before ${kind} body.`);

        const body = this.block();

        return new FunctionStmt(name, genericParams, params, returnType, body);
    }

    private parameter(): Parameter {
        const name = this.consume("IDENTIFIER", "Expect parameter name.");
        this.consume("COLON", "Expect ':' after parameter name.");
        const type = this.typeExpr();
        return new Parameter(name, type);
    }

    private genericParameters(): GenericParameter[] {
        const genericParams = [];

        if (this.match("LEFT_BRACKET") && !this.match("RIGHT_BRACKET")) {
            do {
                genericParams.push(this.genericParameter());
            } while (this.match("COMMA"));

            this.consume(
                "RIGHT_BRACKET", "expect ']' after generic parameters.");
        }

        return genericParams;
    }

    private genericParameter(): GenericParameter {
        const name =
            this.consume("IDENTIFIER", "Expect generic parameter name.");

        const superType = this.match("LESS") ? this.typeExpr() : null;
        return new GenericParameter(name, superType);
    }

    private typeExpr(): TypeExpr {
        let typeExpr = this.nonUnionTypeExpr();

        while (this.match("PIPE")) {
            const operator = this.previous();
            const right = this.nonUnionTypeExpr();

            typeExpr = new UnionTypeExpr(typeExpr, operator, right);
        }

        return typeExpr;
    }

    private nonUnionTypeExpr(): TypeExpr {
        if (this.match("FUN")) return this.callableTypeExpr();

        const name = this.consume("IDENTIFIER", "Expect type.");

        if (this.match("LEFT_BRACKET") && !this.match("RIGHT_BRACKET")) {
            const genericArgs = [];

            do {
                genericArgs.push(this.typeExpr());
            } while (this.match("COMMA"));

            const closingBracket = this.consume(
                "RIGHT_BRACKET", "expect ']' after generic arguments.");

            return new GenericTypeExpr(name, genericArgs, closingBracket);
        }

        return new VariableTypeExpr(name);
    }

    private callableTypeExpr(): TypeExpr {
        const fun = this.previous();

        const genericParams = this.genericParameters();

        this.consume("LEFT_PAREN", "Expect '(' after 'fun'.");

        const paramTypes: TypeExpr[] = [];

        if (!this.check("RIGHT_PAREN")) {
            do {
                paramTypes.push(this.typeExpr());
            } while (this.match("COMMA"));
        }

        const closingParen =
            this.consume("RIGHT_PAREN", "Expect ')' after parameter types.");

        const returnType = this.match("COLON") ? this.typeExpr() : null;

        return new CallableTypeExpr(
            fun, genericParams, paramTypes, closingParen, returnType);
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
            const value = this.assignment();

            if (expr instanceof VariableExpr) {
                return new AssignExpr(expr.name, value);
            } else if (expr instanceof GetExpr) {
                return new SetExpr(expr.object, expr.name, value);
            }

            // Report a parse error, but don't throw it, as we do not
            // need to synchronize here.
            this.error("Invalid assignment target.", expr);
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
            if (this.check("LEFT_BRACKET") || this.check("LEFT_PAREN")) {
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
        const genericArgs = [];

        if (this.match("LEFT_BRACKET") && !this.match("RIGHT_BRACKET")) {
            do {
                genericArgs.push(this.typeExpr());
            } while (this.match("COMMA"));

            this.consume(
                "RIGHT_BRACKET", "expect ']' after generic arguments.");
        }

        const args: Expr[] = [];

        this.consume("LEFT_PAREN", "Expect '(' after generic arguments.");

        if (!this.check("RIGHT_PAREN")) {
            do {
                if (args.length >= 255) {
                    this.error(
                        "Cannot have more than 255 arguments.",
                        this.peek(),
                    );
                }
                args.push(this.expression());
            } while (this.match("COMMA"));
        }

        const paren =
            this.consume("RIGHT_PAREN", "Expect ')' after arguments.");

        return new CallExpr(callee, genericArgs, args, paren);
    }

    private primary(): Expr {
        if (this.match("FALSE")) return new LiteralExpr(loxFalse, this.previous());
        if (this.match("TRUE")) return new LiteralExpr(loxTrue, this.previous());

        if (this.match("NIL", "NUMBER", "STRING")) {
            const token = this.previous();
            return new LiteralExpr(token.literal as LoxValue, token);
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

        throw this.error("Expect expression.", this.peek());
    }

    private consume(type: TokenType, message: string): Token {
        if (this.check(type)) return this.advance();

        throw this.error(message, this.peek());
    }

    private error(
        message: string,
        token: {sourceRange(): SourceRange},
    ): SyntaxError {
        const error = new SyntaxError(message, token.sourceRange());
        this.errors.push(error);
        return error;
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