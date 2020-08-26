import SourceLocation from "./SourceLocation";

export default class SourceRange {
    constructor(
        readonly start: SourceLocation,
        readonly end: SourceLocation,
    ) {}
}
