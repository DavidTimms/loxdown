import * as fs from "fs";
import * as readline from "readline";

import Token from "./Token";
import TokenType from "./TokenType";
import Scanner from "./Scanner";
import Parser from "./Parser";
import Interpreter from "./Interpreter";
import RuntimeError from "./RuntimeError";

export default class Lox {
    private hadError = false;
    private hadRuntimeError = false;
    private readonly interpreter = new Interpreter(this);

    runFile(path: string): void {
        this.run(fs.readFileSync(path, {encoding: "utf8"}));

        // Indicate an error in the exit code
        if (this.hadError) process.exit(65);
        if (this.hadRuntimeError) process.exit(70);
    }

    runPrompt(): void {
        process.stdin.setEncoding("utf8");
        const stdinInterface = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const nextLine = (): void => {
            stdinInterface.question("> ", line => {
                this.run(line);
                this.hadError = false;
                nextLine();
            });
        };

        nextLine();
    }

    run(source: string): void {
        const scanner = new Scanner(this, source);
        const tokens = scanner.scanTokens();

        const parser = new Parser(this, tokens);
        const statements = parser.parse();

        if (statements) this.interpreter.interpret(statements);
    }

    error(location: number | Token, message: string): void {
        if (location instanceof Token) {
            if (location.type === TokenType.EOF) {
                this.report(location.line, " at end", message);
            } else {
                this.report(location.line, ` at '${location.lexeme}'`, message);
            }
        }
        else {
            this.report(location, "", message);
        }
    }

    runtimeError(error: RuntimeError): void {
        console.log(`${error.message}\n[line ${error.token.line}]`);
        this.hadRuntimeError = true;
    }

    report(line: number, where: string, message: string): void {
        console.error(`[line ${line}] Error${where}: ${message}`);
        this.hadError = true;
    }
}
