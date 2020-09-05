import SourceRange from "./SourceRange";

export default class RuntimeError {
    readonly sourceRange: SourceRange;
    constructor(
        readonly message: string,
        location: {sourceRange(): SourceRange},
    ) {
        this.sourceRange = location.sourceRange();
    }
}
