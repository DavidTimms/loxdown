
import Lox from "./Lox";
import Scanner from "./Scanner";
import parse from "./newParser";

function parseString(source: string): void {
    const lox = new Lox();
    const scanner = new Scanner(lox, source);
    console.log("\n" + source);
    console.log(parse(scanner.scanTokens()));
    console.log(JSON.stringify(parse(scanner.scanTokens())));
}

parseString("true");
parseString("false");
parseString("nil");
parseString("123");
parseString("\"hello there\"");
parseString("hello");
parseString("(123)");
parseString("123)");
parseString("(123");
parseString("foo()");
parseString("call(123)");
parseString("multipleArgs(a, b)");
