import Token from "./Token";
import TokenType from "./TokenType";
import Stmt from "./Stmt";
import { Expr, LiteralExpr, VariableExpr, GroupingExpr, CallExpr } from "./Expr";

class ParseError {
    readonly type = "ParseError";
    constructor(
        readonly token: Token,
        readonly message: string,
    ) {}
}

class Ok<A> {
    readonly type = "Ok";
    constructor(
        readonly value: A,
    ) {}
}

type Context = {
    readonly tokens: Token[];
};

type Result<A> = Ok<[A, number, Context]> | ParseError;

type Parser<A> = (current: number, ctx: Context) => Result<A>;


export default function parse(tokens: Token[]): Ok<Expr[]> | ParseError[] {
    const result = expression(0, {tokens});
    if (result.type === "ParseError") {
        return [result];
    }
    const [expr, current, ctx] = result.value;
    const token = head(current, ctx);
    if (token.type !== TokenType.EOF) {
        return [new ParseError(token, "Unparsed input.")];
    }
    return new Ok([expr]);
}

const head = (current: number, ctx: Context): Token => {
    return ctx.tokens[current];
};


const tokenType =
    (type: TokenType): Parser<Token> =>(current, ctx): Result<Token> => {
        const token = head(current, ctx);
        if (token.type === type) return new Ok([token, current + 1, ctx]);
        return new ParseError(token, `Expected ${type}.`);
    };

const optional = <A>(parser: Parser<A>): Parser<A | null> =>
    (current, ctx): Result<A | null> => {
        const result = parser(current, ctx);
        if (result.type === "Ok") return result;
        return new Ok([null, current, ctx]);
    };

const sequence = <Types extends unknown[]>(
    ...parsers: {[K in keyof Types]: Parser<Types[K]>}
): Parser<Types> => (current, ctx): Result<Types> => {
        let item;
        const items = [];
        for (const parser of parsers) {
            const result = parser(current, ctx);
            if (result.type === "ParseError") return result;
            [item, current, ctx] = result.value;
            items.push(item);
        }
        return new Ok([items as Types, current, ctx]);
    };

const map = <A, B>(parser: Parser<A>, mapper: (value: A) => B): Parser<B> =>
    (current, ctx): Result<B> => {
        let value: A;
        const result = parser(current, ctx);
        if (result.type === "ParseError") return result;
        [value, current, ctx] = result.value;
        return new Ok([mapper(value), current, ctx]);
    };

const many = <A>(parser: Parser<A>): Parser<A[]> =>
    (current, ctx): Result<A[]> => {
        let item: A;
        const items: A[] = [];
        for (;;) {
            const result = parser(current, ctx);
            if (result.type === "ParseError") {
                return new Ok([items, current, ctx]);
            }
            [item, current, ctx] = result.value;
            items.push(item);
        }
    };


const leftParen = tokenType(TokenType.LeftParen);
const rightParen = tokenType(TokenType.RightParen);

const primary: Parser<Expr> = (current, ctx) => {
    const token = head(current, ctx);
    let expr = null;

    switch (token.type) {
        case TokenType.False:
            expr = new LiteralExpr(false);
            break;
        case TokenType.True:
            expr = new LiteralExpr(true);
            break;
        case TokenType.Nil:
            expr = new LiteralExpr(null);
            break;
        case TokenType.Number:
        case TokenType.String:
            expr = new LiteralExpr(token.literal);
            break;
        case TokenType.Identifier:
            expr = new VariableExpr(token);
            break;
        case TokenType.LeftParen:
            return grouping(current, ctx);
        default:
            return new ParseError(token, "Expected an expression.");
    }

    return new Ok([expr, current + 1, ctx]);
};

const expression: Parser<Expr> = (current, ctx) => call(current, ctx);

interface ArgList {
    readonly opening: Token;
    readonly args: Expr[];
    readonly closing: Token;
}

const argList: Parser<ArgList> = map(
    sequence<[Token, Expr[], Token]>(
        leftParen,
        many(expression),
        rightParen,
    ),
    ([opening, args, closing]) => ({opening, args, closing}),
);

const call = map(
    sequence<[Expr, ArgList | null]>(primary, optional(argList)),
    ([callee, argList]) =>
        argList === null
            ? callee as Expr
            : new CallExpr(callee, argList.closing, argList.args),
);

const grouping = map(
    sequence<[Token, Expr, Token]>(leftParen, expression, rightParen),
    items => new GroupingExpr(items[1] as Expr),
);
