import Token from "./Token";
import TokenType from "./TokenType";
import ErrorHandler from "./ErrorHandler";
import LoxValue from "./LoxValue";

const keywords = new Map([
    ["and", TokenType.And],
    ["class", TokenType.Class],
    ["else", TokenType.Else],
    ["false", TokenType.False],
    ["for", TokenType.For],
    ["fun", TokenType.Fun],
    ["if", TokenType.If],
    ["nil", TokenType.Nil],
    ["or", TokenType.Or],
    ["print", TokenType.Print],
    ["return", TokenType.Return],
    ["super", TokenType.Super],
    ["this", TokenType.This],
    ["true", TokenType.True],
    ["var", TokenType.Var],
    ["while", TokenType.While],
]);

export default class Scanner {
    private readonly tokens: Token[] = [];
    private start = 0;
    private current = 0;
    private line = 1;

    constructor(private readonly source: string, public error: ErrorHandler) {
        this.source = source;
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token(TokenType.EOF, "", null, this.line));
        return this.tokens;
    }

    isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    scanToken(): void {
        const c = this.advance();

        switch (c) {
            case "(": this.addToken(TokenType.LeftParen); break;
            case ")": this.addToken(TokenType.RightParen); break;
            case "{": this.addToken(TokenType.LeftBrace); break;
            case "}": this.addToken(TokenType.RightBrace); break;
            case ",": this.addToken(TokenType.Comma); break;
            case ".": this.addToken(TokenType.Dot); break;
            case "-": this.addToken(TokenType.Minus); break;
            case "+": this.addToken(TokenType.Plus); break;
            case ";": this.addToken(TokenType.Semicolon); break;
            case "*": this.addToken(TokenType.Star); break;
            case "!":
                this.addToken(
                    this.match("=")
                        ? TokenType.BangEqual
                        : TokenType.Bang,
                );
                break;
            case "=":
                this.addToken(
                    this.match("=")
                        ? TokenType.EqualEqual
                        : TokenType.Equal,
                );
                break;
            case "<":
                this.addToken(
                    this.match("=")
                        ? TokenType.LessEqual
                        : TokenType.Less,
                );
                break;
            case ">":
                this.addToken(
                    this.match("=")
                        ? TokenType.GreaterEqual
                        : TokenType.Greater,
                );
                break;
            case "/":
                if (this.match("/")) {
                    // A comment goes until the end of the line
                    while (this.peek() !== "\n" && !this.isAtEnd()) {
                        this.advance();
                    }
                } else if (this.match("*")) {
                    this.blockComment();
                } else {
                    this.addToken(TokenType.Slash);
                }
                break;
            case " ":
            case "\r":
            case "\t":
                // Ignore whitespace
                break;
            case "\n":
                this.line += 1;
                break;
            case "\"":
                this.string();
                break;
            default:
                if (isDigit(c)) {
                    this.number();
                } else if (isAlpha(c)) {
                    this.identifier();
                } else {
                    this.error(
                        this.line,
                        `Unexpected character: ${JSON.stringify(c)}`,
                    );
                }
        }
    }

    blockComment(): void {
        while (
            !(this.match("*") && this.match("/")) &&
            !this.isAtEnd()
        ) {
            if (this.peek() === "\n") this.line += 1;
            this.advance();
        }
    }

    string(): void {
        while (this.peek() !== "\"" && !this.isAtEnd()) {
            if (this.peek() === "\n") this.line += 1;
            this.advance();
        }

        // Unterminated string
        if (this.isAtEnd()) {
            this.error(this.line, "Unterminated string.");
            return;
        }

        // The closing "
        this.advance();

        // Trim the surrounding quotes
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken(TokenType.String, value);
    }

    number(): void {
        while (isDigit(this.peek())) this.advance();

        // Look for a fractional part
        if (this.peek() === "." && isDigit(this.peekNext())) {
            // Consume the "."
            this.advance();

            while (isDigit(this.peek())) this.advance();
        }

        this.addToken(
            TokenType.Number,
            parseFloat(this.source.substring(this.start, this.current)),
        );
    }

    identifier(): void {
        while (isAlphaNumeric(this.peek())) this.advance();

        const text = this.source.substring(this.start, this.current);
        this.addToken(keywords.get(text) || TokenType.Identifier);
    }

    advance(): string {
        this.current += 1;
        return this.source.charAt(this.current - 1);
    }

    addToken(type: TokenType, literal: LoxValue = null): void {
        const text = this.source.substring(this.start, this.current);
        this.tokens.push(new Token(type, text, literal, this.line));
    }

    match(expected: string): boolean {
        if (this.isAtEnd()) return false;
        if (this.source.charAt(this.current) !== expected) return false;

        this.current += 1;
        return true;
    }

    peek(): string {
        if (this.isAtEnd()) return "\0";
        return this.source.charAt(this.current);
    }

    peekNext(): string {
        if (this.current + 1 >= this.source.length) return "\0";
        return this.source.charAt(this.current + 1);
    }
}

function isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
}

function isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") ||
           (c >= "A" && c <= "Z") ||
            c === "_";
}

function isAlphaNumeric(c: string): boolean {
    return isAlpha(c) || isDigit(c);
}
