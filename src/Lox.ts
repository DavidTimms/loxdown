import * as fs from "fs";
import * as readline from "readline";

import SourceLocation from "./SourceLocation";
import Token from "./Token";
import Scanner from "./Scanner";
import Parser from "./Parser";
import Interpreter from "./Interpreter";
import RuntimeError from "./RuntimeError";
import { ExpressionStmt, PrintStmt } from "./Stmt";
import TypeChecker from "./typechecker/TypeChecker";
import SourceRange from "./SourceRange";

export default class Lox {
    private hadError = false;
    private hadRuntimeError = false;
    private readonly interpreter = new Interpreter(this);
    private readonly typechecker = new TypeChecker(this.interpreter);

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
                this.run(line, {printLastExpr: true});
                this.hadError = false;
                nextLine();
            });
        };

        nextLine();
    }

    run(source: string, {printLastExpr = false} = {}): void {
        const scanner = new Scanner(this, source);
        const tokens = scanner.scanTokens();

        const parser = new Parser(this, tokens);
        const statements = parser.parse();

        if (!statements || this.hadError) return;

        const staticErrors = this.typechecker.checkProgram(statements);

        if (staticErrors.length > 0) {
            for (const error of staticErrors) {
                this.rangeError(source, error.sourceRange, error.message);
            }
            return;
        }

        // Replace final expression statement with print statement
        // so expressions get printed in the REPL
        const lastStatement = statements[statements.length - 1];
        if (printLastExpr && lastStatement instanceof ExpressionStmt) {
            statements[statements.length - 1] =
                new PrintStmt(lastStatement.expression);
        }

        this.interpreter.interpret(statements);
    }

    error(location: SourceLocation, message: string): void {
        if (location instanceof Token) {
            if (location.type === "EOF") {
                this.report(location.line, " at end", message);
            } else {
                this.report(location.line, ` at '${location.lexeme}'`, message);
            }
        } else {
            this.report(location.line, "", message);
        }
    }

    runtimeError(error: RuntimeError): void {
        let errorMessage = error.message;
        if (error.token) {
            errorMessage += `\n[line ${error.token.line}]`;
        }
        this.printError(errorMessage);
        this.hadRuntimeError = true;
    }

    report(line: number, where: string, message: string): void {
        this.printError(`[line ${line}] Error${where}: ${message}`);
        this.hadError = true;
    }

    rangeError(source: string, range: SourceRange, message: string): void {
        const indent = 6;
        const {start} = range;

        const sourceLine = source.split("\n")[start.line - 1];
        const underline =
            Array(indent + start.column - 1).fill(" ").join("") +
            Array(range.length()).fill("^").join("");


        const report =
            `${start.line}:${start.column} - error: ${message}\n\n` +
            `${start.line.toString().padEnd(indent)}${sourceLine}\n` +
            underline;

        this.printError(report);
    }

    printError(message: string): void {
        console.error(message);
    }

    print(message: string): void {
        console.log(message);
    }
}
