import Lox from "./Lox";
import Token from "./Token";
import TokenType from "./TokenType";
import LoxValue from "./LoxValue";
import { nil } from "./LoxNil";
import LoxString from "./LoxString";
import LoxNumber from "./LoxNumber";

const keywords = new Map<string, TokenType>([
    ["and", "AND"],
    ["class", "CLASS"],
    ["else", "ELSE"],
    ["false", "FALSE"],
    ["for", "FOR"],
    ["fun", "FUN"],
    ["if", "IF"],
    ["nil", "NIL"],
    ["or", "OR"],
    ["print", "PRINT"],
    ["return", "RETURN"],
    ["super", "SUPER"],
    ["this", "THIS"],
    ["true", "TRUE"],
    ["var", "VAR"],
    ["while", "WHILE"],
]);

export default class Scanner {
    private readonly tokens: Token[] = [];
    private start = 0;
    private current = 0;
    private line = 1;

    constructor(private readonly lox: Lox, private readonly source: string) {
        this.lox = lox;
        this.source = source;
    }

    scanTokens(): Token[] {
        while (!this.isAtEnd()) {
            this.start = this.current;
            this.scanToken();
        }

        this.tokens.push(new Token("EOF", "", null, this.line));
        return this.tokens;
    }

    isAtEnd(): boolean {
        return this.current >= this.source.length;
    }

    scanToken(): void {
        const c = this.advance();

        switch (c) {
            case "(": this.addToken("LEFT_PAREN"); break;
            case ")": this.addToken("RIGHT_PAREN"); break;
            case "{": this.addToken("LEFT_BRACE"); break;
            case "}": this.addToken("RIGHT_BRACE"); break;
            case ",": this.addToken("COMMA"); break;
            case ".": this.addToken("DOT"); break;
            case "-": this.addToken("MINUS"); break;
            case "+": this.addToken("PLUS"); break;
            case ":": this.addToken("COLON"); break;
            case ";": this.addToken("SEMICOLON"); break;
            case "*": this.addToken("STAR"); break;
            case "!":
                this.addToken(
                    this.match("=")
                        ? "BANG_EQUAL"
                        : "BANG",
                );
                break;
            case "=":
                this.addToken(
                    this.match("=")
                        ? "EQUAL_EQUAL"
                        : "EQUAL",
                );
                break;
            case "<":
                this.addToken(
                    this.match("=")
                        ? "LESS_EQUAL"
                        : "LESS",
                );
                break;
            case ">":
                this.addToken(
                    this.match("=")
                        ? "GREATER_EQUAL"
                        : "GREATER",
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
                    this.addToken("SLASH");
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
                    this.lox.error(
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
            this.lox.error(this.line, "Unterminated string.");
            return;
        }

        // The closing "
        this.advance();

        // Trim the surrounding quotes
        const value = this.source.substring(this.start + 1, this.current - 1);
        this.addToken("STRING", new LoxString(value));
    }

    number(): void {
        while (isDigit(this.peek())) this.advance();

        // Look for a fractional part
        if (this.peek() === "." && isDigit(this.peekNext())) {
            // Consume the "."
            this.advance();

            while (isDigit(this.peek())) this.advance();
        }

        const value =
            parseFloat(this.source.substring(this.start, this.current));

        this.addToken("NUMBER", new LoxNumber(value));
    }

    identifier(): void {
        while (isAlphaNumeric(this.peek())) this.advance();

        const text = this.source.substring(this.start, this.current);

        if (text === "nil") {
            this.addToken("NIL", nil);
        } else {
            this.addToken(keywords.get(text) || "IDENTIFIER");
        }

    }

    advance(): string {
        this.current += 1;
        return this.source.charAt(this.current - 1);
    }

    addToken(type: TokenType, literal: LoxValue | null = null): void {
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
