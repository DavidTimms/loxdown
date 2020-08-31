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
import TypeExpr, { TypeExprVisitor, VariableTypeExpr, CallableTypeExpr } from "../TypeExpr";
import { zip, comparator } from "../helpers";
import CallableType from "./CallableType";
import { default as types } from "./builtinTypes";
import globalsTypes from "./globalsTypes";
import ImplementationError from "../ImplementationError";
import Field from "../Field";
import SourceRange from "../SourceRange";

class LoxError {
    constructor(
        readonly message: string,
        readonly sourceRange: SourceRange,
    ) {}
}

class Scope {
    readonly typeNamespace: Map<string, Type>;
    readonly valueNamespace: Map<string, Type | null>;
    readonly functions: FunctionStmt[];
    constructor(initialProps: Partial<Scope> = {}) {
        this.typeNamespace = initialProps.typeNamespace ?? new Map();
        this.valueNamespace = initialProps.valueNamespace ?? new Map();
        this.functions = initialProps.functions ?? [];
    }

    clone(): Scope {
        return new Scope({
            typeNamespace: new Map(this.typeNamespace.entries()),
            valueNamespace: new Map(this.valueNamespace.entries()),
            functions: [...this.functions],
        });
    }
}

interface FunctionContext {
    tag: "FUNCTION" | "INITIALIZER" | "METHOD";
    type: CallableType;
}

type ClassContext = "NONE" | "CLASS" | "SUBCLASS";

export default class TypeChecker
implements ExprVisitor<Type>, StmtVisitor<void>, TypeExprVisitor<Type> {
    private scopes: Scope[] = [this.globalScope()];
    private currentFunction: FunctionContext | null = null;
    private currentClass: ClassContext = "NONE";
    private errors: LoxError[] = [];

    constructor(
        private readonly interpreter: Interpreter,
    ) {}

    globalScope(): Scope {
        return new Scope({
            typeNamespace: new Map(Object.entries(types)),
            valueNamespace: new Map(Object.entries(globalsTypes)),
        });
    }

    checkProgram(stmts: Stmt[]): LoxError[] {
        const scopesSnapshot = this.scopes.map(scope => scope.clone());
        this.errors = [];
        this.checkStmts(stmts);
        this.checkDeferredFunctionBodies();
        if (this.errors.length > 0) {
            // if there are type errors, restore the state of the scopes to
            // their state before the program was checked. This ensures the
            // typechecker state stays in sync with the interpreter state
            // in the REPL.
            this.scopes = scopesSnapshot;
            this.sortErrorBySourceLocation();
            return this.errors;
        }
        return [];
    }

    private sortErrorBySourceLocation(): void {
        this.errors.sort(comparator(error => [
            error.sourceRange.start.line,
            error.sourceRange.start.column,
        ]));
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
                `Expected '${expectedType}', but found '${exprType}'.`,
                expr,
            );
        }

        // Should this return the expected type instead of the actual type?
        return exprType;
    }

    private isTypeCompatible(candidate: Type, target: Type): boolean {
        // Anything can be assigned to an 'Any' type.
        if (target.tag === "ANY") return true;

        // 'PreviousTypeError' is used to avoid cascading type errors
        // so it can be assigned to anything.
        if (candidate === types.PreviousTypeError) return true;

        // An instance is compatible with its superclass.
        if (target.tag === "INSTANCE") {
            let currentClassType: ClassType | null = candidate.classType;
            while (currentClassType) {
                if (currentClassType === target.classType) return true;
                currentClassType = currentClassType.superclass;
            }
        }

        if (target.tag === "CALLABLE" && candidate.callable) {
            const callable = candidate.callable;
            if (callable && this.isCallableTypeCompatible(callable, target)) {
                return true;
            }
        }

        return candidate === target;
    }

    private isCallableTypeCompatible(
        candidate: CallableType,
        target: CallableType,
    ): boolean {
        // Each *target* parameter type must be a subtype of the *candidate*
        // parameter type.
        const areParamsCompatible =
        candidate.params.length === target.params.length &&
        candidate.params.every(
            (candidateParam, i) => this.isTypeCompatible(
                target.params[i],
                candidateParam,
            ));

        if (!areParamsCompatible) return false;

        // The *candidate* return type must be a subtype of the *target*
        // return type.
        const areReturnTypesCompatible =
            (
                candidate.returns &&
                target.returns &&
                this.isTypeCompatible(candidate.returns, target.returns)
            ) || (
                candidate.returns === null &&
                target.returns === null
            );

        return areReturnTypesCompatible;
    }

    private attemptTypeUnion(left: Type, right: Type): Type | null {
        if (left === right) return left;
        if (left === types.PreviousTypeError) return right;
        if (right === types.PreviousTypeError) return left;

        // Find a common ancestor in the inheritance chains of two instances
        if (left.tag === "INSTANCE" && right.tag === "INSTANCE") {
            const latestCommonAncestorPair =
                zip(left.inheritanceChain(), right.inheritanceChain())
                    .reverse()
                    .find(
                        ([leftAncestor, rightAncestor]) =>
                            leftAncestor === rightAncestor,
                    );

            return latestCommonAncestorPair ?
                latestCommonAncestorPair[0] : null;
        }

        // Unable to find a type that contains both types
        return null;
    }

    private getFunctionType(func: FunctionStmt): CallableType {
        const paramTypes =
            func.params.map(param => this.evaluateTypeExpr(param.type));

        const returnType =
            func.returnType ? this.evaluateTypeExpr(func.returnType) : null;

        return new CallableType(paramTypes, returnType);
    }

    private checkFunctionBody(
        func: FunctionStmt,
        context: FunctionContext,
    ): void {
        const enclosingFunction = this.currentFunction;
        this.currentFunction = context;

        this.beginScope();
        for (const [param, type] of zip(func.params, context.type.params)) {
            this.declareValue(param.name);
            this.defineValue(param.name, type);
        }
        this.checkStmts(func.body);
        this.endScope();
        this.currentFunction = enclosingFunction;
    }

    // Adds a function to a list to be checked at the end of the scope.
    // Checking function bodies is deferred to allow mutual recursion.
    deferCheckingFunctionBody(functionStmt: FunctionStmt): void {
        this.scopes[0].functions.push(functionStmt);
    }

    private checkDeferredFunctionBodies(): void {
        const scope = this.scopes[0];

        while (scope.functions.length > 0) {
            const func = scope.functions.shift() as FunctionStmt;
            const name = func.name.lexeme;
            const type = scope.valueNamespace.get(name);
            if (!(type instanceof CallableType)) {
                throw new ImplementationError(
                    `Unable to find callable type for function '${name}' ` +
                    "in scope.",
                );
            }
            this.checkFunctionBody(func, {tag: "FUNCTION", type});
        }
    }

    private beginScope(): void {
        this.scopes.unshift(new Scope());
    }

    private endScope(): void {
        this.checkDeferredFunctionBodies();
        const scope = this.scopes.shift();

        // // Print the types of variables in this scope
        // if (scope) {
        //     const indent = Array(this.scopes.length).fill("  ").join("");
        //     for (const [name, type] of scope.valueNamespace.entries()) {
        //         console.log(`${indent}${name}: ${type}`);
        //     }
        // }
    }

    private declareValue(name: Token): void {
        const {valueNamespace} = this.scopes[0];

        if (valueNamespace.has(name.lexeme)) {
            this.error(
                "Variable with this name already declared in this scope.",
                name,
            );
        }

        valueNamespace.set(name.lexeme, null);
    }

    private defineValue(name: Token, type: Type): void {
        this.scopes[0].valueNamespace.set(name.lexeme, type);
    }

    private defineType(name: Token, type: Type): void {
        this.scopes[0].typeNamespace.set(name.lexeme, type);
    }

    private resolveName(expr: Expr, name: Token): Type {
        for (const [i, scope] of this.scopes.entries()) {
            const type = scope.valueNamespace.get(name.lexeme);
            if (type) {
                this.interpreter.resolve(expr, i);
                return type;
            }
        }

        return this.error(`The name '${name.lexeme}' is not defined.`, name);
    }

    private evaluateTypeExpr(typeExpr: TypeExpr): Type {
        return typeExpr.accept(this);
    }

    visitVariableTypeExpr(typeExpr: VariableTypeExpr): Type {
        const name = typeExpr.name;

        for (const scope of this.scopes) {
            const type = scope.typeNamespace.get(name.lexeme);
            if (type) return type;
        }

        return this.error(`The type '${name.lexeme}' is not defined.`, name);
    }

    visitCallableTypeExpr(typeExpr: CallableTypeExpr): Type {
        const params =
            typeExpr.paramTypes.map(param => this.evaluateTypeExpr(param));

        const returns =
            typeExpr.returnType ?
                this.evaluateTypeExpr(typeExpr.returnType) : null;

        return new CallableType(params, returns);
    }

    visitBlockStmt(stmt: BlockStmt): void {
        this.beginScope();
        this.checkStmts(stmt.statements);
        this.endScope();
    }

    visitClassStmt(stmt: ClassStmt): void {
        const enclosingClass = this.currentClass;
        this.currentClass = "CLASS";

        this.declareValue(stmt.name);

        let superType: ClassType | null = null;

        if (stmt.superclass) {
            this.currentClass = "SUBCLASS";

            if (stmt.name.lexeme === stmt.superclass.name.lexeme) {
                this.error(
                    "A class cannot inherit from itself.",
                    stmt.superclass.name,
                );
            } else {
                const potentialSuperType = this.checkExpr(stmt.superclass);

                if (potentialSuperType instanceof ClassType) {
                    superType = potentialSuperType;
                } else {
                    const superclassName = stmt.superclass?.name.lexeme;
                    this.error(
                        `Cannot inherit from '${superclassName}' ` +
                        "because it is not a class.",
                        stmt.superclass.name,
                    );
                }
            }
        }

        const fields: Map<string, Type> = this.getFieldTypes(stmt.fields);
        const methods = this.getMethodTypes(stmt.methods);

        const classType = new ClassType(
            stmt.name.lexeme, {fields, methods, superclass: superType});
        this.defineValue(stmt.name, classType);
        this.defineType(stmt.name, classType.instance());

        if (superType) {
            this.beginScope();
            this.scopes[0].valueNamespace.set("super", superType.instance());
        }

        this.beginScope();
        this.scopes[0].valueNamespace.set("this", classType.instance());

        // TODO check method bodies
        this.checkMethods(stmt.methods, classType);

        this.endScope();

        if (superType) this.endScope();

        this.currentClass = enclosingClass;
    }

    private getFieldTypes(fields: Field[]): Map<string, Type> {
        const fieldTypes = new Map<string, Type>();

        for (const field of fields) {
            const type = this.evaluateTypeExpr(field.type);
            fieldTypes.set(field.name.lexeme, type);
        }

        return fieldTypes;
    }

    private getMethodTypes(methods: FunctionStmt[]): Map<string, Type> {
        const methodTypes = new Map<string, Type>();

        for (const method of methods) {
            methodTypes.set(method.name.lexeme, this.getFunctionType(method));
        }

        return methodTypes;
    }

    private checkMethods(methods: FunctionStmt[], classType: ClassType): void {
        for (const method of methods) {
            const name = method.name.lexeme;

            const type = classType.findMember(name);

            if (!(type instanceof CallableType)) {
                throw new ImplementationError(
                    `Unable to find callable type for method '${name}' ` +
                    "in class.",
                );
            }

            const contextTag = name === "init" ? "INITIALIZER" : "METHOD";

            this.checkFunctionBody(method, {tag: contextTag, type});
        }
    }

    visitExpressionStmt(stmt: ExpressionStmt): void {
        this.checkExpr(stmt.expression);
    }

    visitFunctionStmt(stmt: FunctionStmt): void {
        const type = this.getFunctionType(stmt);
        this.declareValue(stmt.name);
        this.defineValue(stmt.name, type);
        this.deferCheckingFunctionBody(stmt);
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
        if (this.currentFunction === null) {
            this.error("Cannot return from top-level code.", stmt.keyword);
            return;
        }

        if (stmt.value) {
            if (this.currentFunction.tag === "INITIALIZER") {
                this.error(
                    "Cannot return a value from an initializer.", stmt.keyword);
            } else if (this.currentFunction.type.returns === null) {
                this.error(
                    "Cannot return a value from this function because there " +
                    "is no declared return type.",
                    stmt.value,
                );
            }
            this.checkExpr(stmt.value, this.currentFunction.type.returns);
        }
    }

    visitVarStmt(stmt: VarStmt): void {
        this.declareValue(stmt.name);

        const declaredType =
            stmt.type ? this.evaluateTypeExpr(stmt.type) : null;

        const initializerType =
            stmt.initializer ?
                this.checkExpr(stmt.initializer, declaredType) : null;

        this.defineValue(stmt.name, declaredType ?? initializerType ?? types.Any);
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
            case "PLUS": {
                const leftType = this.checkExpr(expr.left);

                for (const candidate of [types.Number, types.String]) {
                    if (this.isTypeCompatible(leftType, candidate)) {
                        this.checkExpr(expr.right, candidate);
                        return candidate;
                    }
                }

                return this.error(
                    "Incorrect type for the left operand of '+'. " +
                    `Expected '${types.String}' or '${types.Number}',` +
                    ` but found '${leftType}'.`,
                    expr.left,
                );
            }
            case "MINUS":
            case "SLASH":
            case "STAR":
            case "GREATER":
            case "GREATER_EQUAL":
            case "LESS":
            case "LESS_EQUAL":
                this.checkExpr(expr.left, types.Number);
                this.checkExpr(expr.right, types.Number);
                return types.Number;

            case "EQUAL_EQUAL":
            case "BANG_EQUAL":
                // TODO detect disjoint types and warn of constant result
                return types.Boolean;
        }

        // Unreachable
        throw new ImplementationError(
            `Unexpected binary operator: ${expr.operator.lexeme}`);
    }

    visitCallExpr(expr: CallExpr): Type {
        const calleeType = this.checkExpr(expr.callee);

        const callable = calleeType.callable;

        if (callable === null) {
            if (calleeType !== types.PreviousTypeError) {
                this.error(
                    `Type '${calleeType}' is not callable.`, expr.callee);
            }
            for (const arg of expr.args) {
                this.checkExpr(arg);
            }
            return types.PreviousTypeError;
        }

        const args = expr.args;
        let params = callable.params;

        if (args.length > params.length) {
            const startOfFirstExtraArg =
                args[params.length].sourceRange().start;
            const endOfLastExtraArg =
                args[args.length - 1].sourceRange().end;

            this.error(
                "Too many arguments for function call. Expected " +
                `${params.length} arguments, but found ${args.length}.`,
                new SourceRange(startOfFirstExtraArg, endOfLastExtraArg),
            );

            // Pad the params array with nulls to ensure the additional
            // arguments still get checked.
            params =
                params.concat(Array(args.length - params.length).fill(null));

        } else if (args.length < params.length) {
            this.error(
                "Too few arguments for function call. Expected " +
                `${params.length} arguments, but only found ${args.length}.`,
                expr,
            );
        }

        for (const [arg, paramType] of zip(args, params)) {
            this.checkExpr(arg, paramType);
        }

        return callable.returns ?? types.Nil;

    }

    visitGetExpr(expr: GetExpr): Type {
        const objectType = this.checkExpr(expr.object);
        const memberType = objectType.classType?.findMember(expr.name.lexeme);

        if (memberType === null && objectType !== types.PreviousTypeError) {
            this.error(
                `Type '${objectType}' has no property '${expr.name.lexeme}'.`,
                expr.name,
            );
        }

        return memberType ?? types.PreviousTypeError;
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
        throw new ImplementationError("Unexpected literal type.");
    }

    visitLogicalExpr(expr: LogicalExpr): Type {
        const left = this.checkExpr(expr.left);
        const right = this.checkExpr(expr.right);
        const type = this.attemptTypeUnion(left, right);
        if (type === null) {
            return this.error(
                `The operand types for '${expr.operator.lexeme}' are not ` +
                "compatible. They must have a shared superclass. Found " +
                `'${left}' and '${right}'.`,
                expr,
            );
        }
        return type;
    }

    visitSetExpr(expr: SetExpr): Type {
        const objectType = this.checkExpr(expr.object);
        const memberType =
            objectType.classType?.findMember(expr.name.lexeme) ??
            types.PreviousTypeError;

        this.checkExpr(expr.value, memberType);

        return memberType;
    }

    visitSuperExpr(expr: SuperExpr): Type {
        if (this.currentClass === "NONE") {
            return this.error(
                "Cannot use 'super' outside of a class.",
                expr.keyword,
            );
        } else if (this.currentClass !== "SUBCLASS") {
            return this.error(
                "Cannot use 'super' in a class with no superclass.",
                expr.keyword,
            );
        }

        const superType = this.resolveName(expr, expr.keyword);
        const methodType = superType.classType?.findMethod(expr.method.lexeme);

        return methodType ?? this.error(
            `Superclass type '${superType}' has no method ` +
            `'${expr.method.lexeme}'.`,
            expr.method,
        );
    }

    visitThisExpr(expr: ThisExpr): Type {
        if (this.currentClass === "NONE") {
            return this.error(
                "Cannot use 'this' outside of a class.", expr.keyword);
        } else {
            return this.resolveName(expr, expr.keyword);
        }
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
        throw new ImplementationError(
            `Unexpected unary operator: ${expr.operator.lexeme}`);
    }

    visitVariableExpr(expr: VariableExpr): Type {
        if (this.scopes[0].valueNamespace.get(expr.name.lexeme) === null) {
            return this.error(
                "Cannot read local variable in its own initializer.",
                expr.name,
            );
        }
        return this.resolveName(expr, expr.name);
    }

    // Records an error when it is possible to continue typechecking
    private error(message: string, target: {sourceRange(): SourceRange}): Type {
        this.errors.push(new LoxError(message, target.sourceRange()));
        return types.PreviousTypeError;
    }
}
