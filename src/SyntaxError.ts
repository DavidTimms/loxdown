import SourceRange from "./SourceRange";

export default class SyntaxError {
    constructor(
        readonly message: string,
        readonly sourceRange: SourceRange,
    ) {}
}
