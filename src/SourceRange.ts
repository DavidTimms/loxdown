import SourceLocation from "./SourceLocation";

export default class SourceRange {
    constructor(
        readonly start: SourceLocation,
        readonly end: SourceLocation,
    ) {}

    length(): number {
        if (this.start.line === this.end.line) {
            return this.end.column - this.start.column;
        }
        // TODO handle multiline source ranges better.
        return 1;
    }
}
