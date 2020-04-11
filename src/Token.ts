import TokenType from "./TokenType";
import LiteralValue from "./LiteralValue";

export default class Token {
    constructor(
        readonly type: TokenType,
        readonly lexeme: string,
        readonly literal: LiteralValue,
        readonly line: number,
    ) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.line = line;
    }

    toString(): string {
        return `${this.type} ${this.lexeme} ${this.literal}`;
    }
}
