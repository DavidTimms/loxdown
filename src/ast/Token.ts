import TokenType from "./TokenType";
import LoxValue from "../LoxValue";
import SourceRange from "./SourceRange";

export default class Token {
    constructor(
        readonly type: TokenType,
        readonly lexeme: string,
        readonly literal: LoxValue | null,
        readonly line: number,
        readonly column: number,
    ) {}

    toString(): string {
        return `${this.type} ${this.lexeme} ${this.literal}`;
    }

    sourceRange(): SourceRange {
        const start = {
            line: this.line,
            column: this.column,
        };
        // TODO handle tokens which span line breaks
        const end = {
            line: this.line,
            column: this.column + this.lexeme.length,
        };
        return new SourceRange(start, end);
    }
}
