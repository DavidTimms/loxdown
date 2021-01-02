import Scanner from "./parser/Scanner";
import Parser from "./parser/Parser";
import Interpreter from "./runtime/Interpreter";
import Stmt, { ExpressionStmt, PrintStmt } from "./ast/Stmt";
import TypeChecker from "./typechecker/TypeChecker";
import SourceRange from "./ast/SourceRange";
import SyntaxError from "./parser/SyntaxError";
import RuntimeError from "./runtime/RuntimeError";
import OutputHandler from "./OutputHandler";

export type CheckStatus =
    | "SYNTAX_ERROR"
    | "STATIC_ERROR"
    | "VALID";

export type RunStatus =
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

    check(source: string): CheckStatus {
        return this.checked(source).status;
    }

    run(source: string, {printLastExpr = false} = {}): RunStatus {
        let program: Stmt[];

        const checked = this.checked(source);

        if (checked.status !== "VALID") {
            return checked.status;
        } else {
            program = checked.program;
        }

        // Replace final expression statement with print statement
        // so expressions get printed in the REPL
        const lastStatement = program[program.length - 1];
        if (printLastExpr && lastStatement instanceof ExpressionStmt) {
            program[program.length - 1] =
                new PrintStmt(lastStatement.expression);
        }

        try {
            this.interpreter.interpret(program);
        } catch (error) {
            if (error instanceof RuntimeError) {
                this.rangeError(source, error.sourceRange, error.message);
                return "RUNTIME_ERROR";
            } else throw error;
        }

        return "SUCCESS";
    }


    private checked(source: string):
        | {status: "SYNTAX_ERROR" | "STATIC_ERROR"}
        | {status: "VALID"; program: Stmt[]} {
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

        if (!statements) return {status: "SYNTAX_ERROR"};

        const staticErrors = this.typechecker.checkProgram(statements);

        if (errors.length + staticErrors.length > 0) {
            for (const error of staticErrors) {
                this.rangeError(source, error.sourceRange, error.message);
            }
            return {status: "STATIC_ERROR"};
        }

        return {status: "VALID", program: statements};
    }

    rangeError(source: string, range: SourceRange, message: string): void {
        const indent = 6;
        const {start} = range;

        // Replace tabs in the line with spaces to avoid the underline
        // being misaligned.
        const sourceLine =
            source.split("\n")[start.line - 1].replace(/\t/g, " ");

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
