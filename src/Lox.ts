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
import OutputHandler from "./OutputHandler";

type RunStatus =
    | "SYNTAX_ERROR"
    | "STATIC_ERROR"
    | "RUNTIME_ERROR"
    | "SUCCESS";

export default class Lox {
    private readonly interpreter = new Interpreter(this.output);
    private readonly typechecker = new TypeChecker(this.interpreter);

    constructor(
        private readonly output: OutputHandler,
    ) {}

    runFile(path: string): RunStatus {
        return this.run(fs.readFileSync(path, {encoding: "utf8"}));
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

    run(source: string, {printLastExpr = false} = {}): RunStatus {
        // TODO refactor this function.
        // Perhaps use a monad to accumulate errors.

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

        if (!statements) return "SYNTAX_ERROR";

        const staticErrors = this.typechecker.checkProgram(statements);

        if (errors.length + staticErrors.length > 0) {
            for (const error of staticErrors) {
                this.rangeError(source, error.sourceRange, error.message);
            }
            return "STATIC_ERROR";
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
                return "RUNTIME_ERROR";
            } else throw error;
        }

        return "SUCCESS";
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

        this.output.printError(report);
    }
}
