import * as fs from "fs";
import * as readline from "readline";
import Scanner from "./Scanner";
import Parser from "./Parser";
import Interpreter from "./Interpreter";
import Stmt, { ExpressionStmt, PrintStmt } from "./Stmt";
import TypeChecker from "./typechecker/TypeChecker";
import SourceRange from "./SourceRange";
import SyntaxError from "./SyntaxError";
import RuntimeError from "./RuntimeError";

export default class Lox {
    private readonly interpreter = new Interpreter(this);
    private readonly typechecker = new TypeChecker(this.interpreter);

    runFile(path: string): void {
        this.run(fs.readFileSync(path, {encoding: "utf8"}));

        // TODO return correct exit code
        // // Indicate an error in the exit code
        // if (this.hadError) process.exit(65);
        // if (this.hadRuntimeError) process.exit(70);
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
                nextLine();
            });
        };

        nextLine();
    }

    run(source: string, {printLastExpr = false} = {}): void {
        let statements: Stmt[] | null = null;
        let errors: SyntaxError[] = [];

        try {
            const tokens = new Scanner(source).scanTokens();
            ({statements, errors} = new Parser(tokens).parse());
        } catch (error) {
            if (error instanceof SyntaxError) {
                errors.push(error);
            } else throw error;
        }

        for (const error of errors) {
            this.rangeError(source, error.sourceRange, error.message);
        }

        if (!statements) return;

        const staticErrors = this.typechecker.checkProgram(statements);

        if (errors.length + staticErrors.length > 0) {
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

        try {
            this.interpreter.interpret(statements);
        } catch (error) {
            if (error instanceof RuntimeError) {
                this.rangeError(source, error.sourceRange, error.message);
            } else throw error;
        }

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
