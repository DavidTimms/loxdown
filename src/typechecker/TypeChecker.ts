import {
    Expr,
    ExprVisitor,
    VariableExpr,
    AssignExpr,
    BinaryExpr,
    CallExpr,
    GroupingExpr,
    LiteralExpr,
    LogicalExpr,
    UnaryExpr,
    GetExpr,
    SetExpr,
    ThisExpr,
    SuperExpr,
} from "../Expr";
import {
    Stmt,
    StmtVisitor,
    BlockStmt,
    VarStmt,
    FunctionStmt,
    ExpressionStmt,
    IfStmt,
    WhileStmt,
    ReturnStmt,
    PrintStmt,
    ClassStmt,
} from "../Stmt";
import Interpreter from "../Interpreter";
import Token from "../Token";
import Lox from "../Lox";
import Type from "./Type";
import ClassType from "./ClassType";
import AnyType from "./AnyType";
import TypeExpr, { TypeExprVisitor, VariableTypeExpr } from "../TypeExpr";
import { type } from "os";

class LoxError {
    constructor(
        readonly message: string,
        readonly token: Token | null,
    ) {}
}

const types = {
    Any: new AnyType(),
    Nil: new ClassType("Nil").instance(),
    Boolean: new ClassType("Boolean").instance(),
    Number: new ClassType("Number").instance(),
    String: new ClassType("String").instance(),
};

type FunctionContext = "NONE" | "FUNCTION" | "INITIALIZER" | "METHOD";

type ClassContext = "NONE" | "CLASS" | "SUBCLASS";

export default class TypeChecker
implements ExprVisitor<Type>, StmtVisitor<void>, TypeExprVisitor<Type> {
    private readonly scopes: Map<string, Type | null>[] = [
        new Map(Object.entries(types)),
    ];
    private currentFunction: FunctionContext = "NONE";
    private currentClass: ClassContext = "NONE";
    private errors: LoxError[] = [];

    constructor(
        private readonly lox: Lox,
        private readonly interpreter: Interpreter,
    ) {}

    checkProgram(stmts: Stmt[]): LoxError[] {
        this.errors = [];
        this.checkStmts(stmts);
        return this.errors;
    }

    private checkStmts(stmts: Stmt[]): void {
        for (const stmt of stmts) {
            this.checkStmt(stmt);
        }
    }

    private checkStmt(stmt: Stmt): void {
        stmt.accept(this);
    }

    private checkExpr(expr: Expr, expectedType: Type | null = null): Type {
        const exprType = expr.accept(this);
        if (expectedType && !this.isTypeCompatible(exprType, expectedType)) {
            this.error(
                "Incorrect type. " +
                `Expected '${expectedType}', but found '${exprType}'.`);
        }

        // Should this return the expected type instead of the actual type?
        return exprType;
    }

    private isTypeCompatible(candidate: Type, target: Type): boolean {
        // An instance is compatible with its superclass
        if (candidate.tag === "INSTANCE" && target.tag === "INSTANCE") {
            let currentClassType: ClassType | null = candidate.classType;
            while (currentClassType) {
                if (currentClassType === target.classType) return true;
                currentClassType = currentClassType.superclass;
            }
            return false;
        }
        return candidate === target;
    }

    private checkFunction(func: FunctionStmt, context: FunctionContext): void {
        // TODO
        throw "Not Implemented Yet";
        // const enclosingFunction = this.currentFunction;
        // this.currentFunction = context;

        // this.beginScope();
        // for (const param of func.params) {
        //     this.declare(param.name);
        //     this.define(param.name);
        // }
        // this.checkStmts(func.body);
        // this.endScope();
        // this.currentFunction = enclosingFunction;
    }

    private beginScope(): void {
        this.scopes.unshift(new Map());
    }

    private endScope(): void {
        this.scopes.shift();
    }

    private declare(name: Token): void {
        if (this.scopes.length === 0) return;
        const scope = this.scopes[0];

        if (scope.has(name.lexeme)) {
            this.error(
                "Variable with this name already declared in this scope.",
                name,
            );
        }

        scope.set(name.lexeme, null);
    }

    private define(name: Token, type: Type): void {
        if (this.scopes.length === 0) return;
        this.scopes[0].set(name.lexeme, type);
    }

    private resolveName(expr: Expr, name: Token): Type {
        for (const [i, scope] of this.scopes.entries()) {
            const type = scope.get(name.lexeme);
            if (type) {
                this.interpreter.resolve(expr, i);
                return type;
            }
        }

        // TODO handle global scope

        this.error(`The name '${name.lexeme}' is not defined.`, name);
        return types.Any;
    }

    private evaluateTypeExpr(typeExpr: TypeExpr): Type {
        return typeExpr.accept(this);
    }

    // Records an error when it is possible to continue typechecking
    private error(message: string, token: Token | null = null): void {
        this.errors.push(new LoxError(message, token));
    }

    visitVariableTypeExpr(typeExpr: VariableTypeExpr): Type {
        const name = typeExpr.name;

        for (const scope of this.scopes) {
            const type = scope.get(name.lexeme);
            if (type) return type;
        }

        // TODO handle global scope

        throw new LoxError(`The name '${name.lexeme}' is not defined.`, name);
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.beginScope();
        this.checkStmts(stmt.statements);
        this.endScope();
    }

    visitClassStmt(stmt: ClassStmt): void {
        const enclosingClass = this.currentClass;
        this.currentClass = "CLASS";

        this.declare(stmt.name);

        let superType = null;

        if (stmt.superclass) {
            if (stmt.name.lexeme === stmt.superclass.name.lexeme) {
                this.error(
                    "A class cannot inherit from itself.",
                    stmt.superclass.name,
                );
            }
            this.currentClass = "SUBCLASS";
            superType = this.checkExpr(stmt.superclass);

            if (superType instanceof ClassType) {
                this.beginScope();
                this.scopes[0].set("super", superType.instance());
            } else {
                this.error(
                    `Cannot inherit from '${stmt.superclass.name.lexeme}' ` +
                    "because it is not a class.",
                    stmt.superclass.name,
                );
                superType = null;
            }

        }
        // TODO populate class member types
        const fields: Map<string, Type> = new Map();
        const methods: Map<string, Type> = new Map();
        const classType = new ClassType(
            stmt.name.lexeme, fields, methods, superType);
        this.define(stmt.name, classType);

        this.beginScope();
        this.scopes[0].set("this", classType.instance());

        for (const method of stmt.methods) {
            const declaration =
                method.name.lexeme === "init" ? "INITIALIZER" : "METHOD";
            this.checkFunction(method, declaration);
        }

        this.endScope();

        if (superType) this.endScope();

        this.currentClass = enclosingClass;
    }

    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.checkExpr(stmt.expression);
    }

    visitFunctionStmt(stmt: FunctionStmt): void {
        // TODO
        throw "Not Implemented Yet";
        // this.declare(stmt.name);
        // this.define(stmt.name);

        // this.checkFunction(stmt, "FUNCTION");
    }

    visitIfStmt(stmt: IfStmt): void {
        this.checkExpr(stmt.condition);
        this.checkStmt(stmt.thenBranch);
        if (stmt.elseBranch) this.checkStmt(stmt.elseBranch);
    }

    visitPrintStmt(stmt: PrintStmt): void {
        this.checkExpr(stmt.expression);
    }

    visitReturnStmt(stmt: ReturnStmt): void {
        if (this.currentFunction === "NONE") {
            this.error("Cannot return from top-level code.", stmt.keyword);
        }

        if (stmt.value) {
            if (this.currentFunction === "INITIALIZER") {
                this.error(
                    "Cannot return a value from an initializer.", stmt.keyword);
            }
            // TODO check type of return value is correct for function
            this.checkExpr(stmt.value);
        }
    }

    visitVarStmt(stmt: VarStmt): void {
        this.declare(stmt.name);

        const declaredType =
            stmt.type ? this.evaluateTypeExpr(stmt.type) : null;

        const initializerType =
            stmt.initializer ?
                this.checkExpr(stmt.initializer, declaredType) : null;

        this.define(stmt.name, declaredType ?? initializerType ?? types.Any);
    }

    visitWhileStmt(stmt: WhileStmt): void {
        this.checkExpr(stmt.condition);
        this.checkStmt(stmt.body);
    }

    visitAssignExpr(expr: AssignExpr): Type {
        const expectedType = this.resolveName(expr, expr.name);
        this.checkExpr(expr.value, expectedType);
        return expectedType;
    }

    visitBinaryExpr(expr: BinaryExpr): Type {
        switch (expr.operator.type) {
            case "PLUS":
            case "MINUS":
            case "SLASH":
            case "STAR":
            case "GREATER":
            case "GREATER_EQUAL":
            case "LESS":
            case "LESS_EQUAL":
                // TODO allow two strings for plus

                this.checkExpr(expr.left, types.Number);
                this.checkExpr(expr.right, types.Number);
                return types.Number;
            case "EQUAL_EQUAL":
            case "BANG_EQUAL":
                // TODO detect disjoint types and warn of constant result
                return types.Boolean;
        }

        // Unreachable
        throw new Error(`Unexpected binary operator: ${expr.operator.lexeme}`);
    }

    visitCallExpr(expr: CallExpr): Type {
        throw "Not Implemented Yet";
        // this.resolve(expr.callee);
        // this.resolveAll(expr.args);
    }

    visitGetExpr(expr: GetExpr): Type {
        throw "Not Implemented Yet";
        // this.resolve(expr.object);
    }

    visitGroupingExpr(expr: GroupingExpr): Type {
        return this.checkExpr(expr.expression);
    }

    visitLiteralExpr(expr: LiteralExpr): Type {
        switch (expr.value.type) {
            case "NIL": return types.Nil;
            case "BOOL": return types.Boolean;
            case "NUMBER": return types.Number;
            case "STRING": return types.String;
        }
        throw new Error("Unexpected literal type.");
    }

    visitLogicalExpr(expr: LogicalExpr): Type {
        throw "Not Implemented Yet";
        // this.resolve(expr.left);
        // this.resolve(expr.right);
    }

    visitSetExpr(expr: SetExpr): Type {
        throw "Not Implemented Yet";
        // this.resolve(expr.value);
        // this.resolve(expr.object);
    }

    visitSuperExpr(expr: SuperExpr): Type {
        throw "Not Implemented Yet";
        // if (this.currentClass === "NONE") {
        //     this.error(
        //         "Cannot use 'super' outside of a class.",
        //         expr.keyword,
        //     );
        // } else if (this.currentClass !== "SUBCLASS") {
        //     this.error(
        //         "Cannot use 'super' in a class with no superclass.",
        //         expr.keyword,
        //     );
        // }
        // this.resolveName(expr, expr.keyword);
    }

    visitThisExpr(expr: ThisExpr): Type {
        throw "Not Implemented Yet";
        // if (this.currentClass === "NONE") {
        //     this.error(
        //         "Cannot use 'this' outside of a class.", expr.keyword);
        // } else {
        //     this.resolveName(expr, expr.keyword);
        // }
    }

    visitUnaryExpr(expr: UnaryExpr): Type {
        switch (expr.operator.type) {
            case "BANG":
                this.checkExpr(expr.right);
                return types.Boolean;
            case "MINUS":
                this.checkExpr(expr.right, types.Number);
                return types.Number;
        }

        // Unreachable
        throw new Error(`Unexpected unary operator: ${expr.operator.lexeme}`);
    }

    visitVariableExpr(expr: VariableExpr): Type {
        if (
            this.scopes.length > 0 &&
            this.scopes[0].get(expr.name.lexeme) === null
        ) {
            this.error(
                "Cannot read local variable in its own initializer.",
                expr.name,
            );
        }
        return this.resolveName(expr, expr.name);
    }
}
