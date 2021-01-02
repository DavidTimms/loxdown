import "codemirror/addon/mode/simple";
import * as CodeMirror from "codemirror";
import keywords from "../keywords.js";

const keywordList = [...keywords.keys()];


CodeMirror.defineSimpleMode("loxdown", {
    start: [
        {regex: /\/\/.*/, token: "comment"},
        {regex: /\/\*/, token: "comment", next: "multiLineComment"},
        {regex: /"[^"]*"/, token: "string"},
        {regex: /"[^"\n]*/, token: "string", next: "multiLineString"},
        {regex: /-|\+|\*|\||!|=|==|!=|<|>|<=|>=|\//, token: "operator"},
        {regex: /true|false|nil/, token: "atom"},
        {regex: /\d(\.\d)?/, token: "number"},
        {regex: new RegExp(`(?:${keywordList.join("|")})\\b`), token: "keyword"},
        {regex: /[A-Z$][\w$]*/, token: "variable-2"},
        {regex: /[a-z$][\w$]*/, token: "variable"},
    ],
    multiLineComment: [
        {regex: /.*?\*\//, token: "comment", next: "start"},
        {regex: /.*/, token: "comment"},
    ],
    multiLineString: [
        {regex: /[^"]*"/, token: "string", next: "start"},
        {regex: /.*/, token: "string"},
    ],
});
