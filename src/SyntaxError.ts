import SourceRange from "./ast/SourceRange";

export default class SyntaxError {
    constructor(
        readonly message: string,
        readonly sourceRange: SourceRange,
    ) {}
}
