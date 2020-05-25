// enum TokenType {
//     // Single-character tokens.
//     LeftParen = "LEFT_PAREN",
//     RightParen = "RIGHT_PAREN",
//     LeftBrace = "LEFT_BRACE",
//     RightBrace = "RIGHT_BRACE",
//     Comma = "COMMA",
//     Dot = "DOT",
//     Minus = "MINUS",
//     Plus = "PLUS",
//     Semicolon = "SEMICOLON",
//     Slash = "SLASH",
//     Star = "STAR",

//     // One or two character tokens.
//     Bang = "BANG",
//     BangEqual = "BANG_EQUAL",
//     Equal = "EQUAL",
//     EqualEqual = "EQUAL_EQUAL",
//     Greater = "GREATER",
//     GreaterEqual = "GREATER_EQUAL",
//     Less = "LESS",
//     LessEqual = "LESS_EQUAL",

//     // Literals.
//     Identifier = "IDENTIFIER",
//     String = "STRING",
//     Number = "NUMBER",

//     // Keywords.
//     And = "AND",
//     Class = "CLASS",
//     Else = "ELSE",
//     False = "FALSE",
//     Fun = "FUN",
//     For = "FOR",
//     If = "IF",
//     Nil = "NIL",
//     Or = "OR",
//     Print = "PRINT",
//     Return = "RETURN",
//     Super = "SUPER",
//     This = "THIS",
//     True = "TRUE",
//     Var = "VAR",
//     While = "WHILE",

//     // End of file.
//     EOF = "EOF",
// }

type TokenType =
    // Single-character tokens.
    "LEFT_PAREN" |
    "RIGHT_PAREN" |
    "LEFT_BRACE" |
    "RIGHT_BRACE" |
    "COMMA" |
    "DOT" |
    "MINUS" |
    "PLUS" |
    "SEMICOLON" |
    "SLASH" |
    "STAR" |

    // One or two character tokens.
    "BANG" |
    "BANG_EQUAL" |
    "EQUAL" |
    "EQUAL_EQUAL" |
    "GREATER" |
    "GREATER_EQUAL" |
    "LESS" |
    "LESS_EQUAL" |

    // Literals.
    "IDENTIFIER" |
    "STRING" |
    "NUMBER" |

    // Keywords.
    "AND" |
    "CLASS" |
    "ELSE" |
    "FALSE" |
    "FUN" |
    "FOR" |
    "IF" |
    "NIL" |
    "OR" |
    "PRINT" |
    "RETURN" |
    "SUPER" |
    "THIS" |
    "TRUE" |
    "VAR" |
    "WHILE" |

    // End of file.
    "EOF";

export default TokenType;
