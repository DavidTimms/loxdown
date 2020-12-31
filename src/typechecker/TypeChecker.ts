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
    ArrayExpr,
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
    TypeStmt,
} from "../Stmt";
import Interpreter from "../Interpreter";
import Token from "../Token";
import Type from "./Type";
import ClassType from "./ClassType";
import {
    TypeExpr,
    TypeExprVisitor,
    VariableTypeExpr,
    CallableTypeExpr,
    UnionTypeExpr,
    GenericTypeExpr,
} from "../TypeExpr";
import { zip, comparator, groupBy, s, padArrayEnd } from "../helpers";
import CallableType from "./CallableType";
import { default as types } from "./builtinTypes";
import globalsTypes from "./globalsTypes";
import ImplementationError from "../ImplementationError";
import Field from "../Field";
import SourceRange from "../SourceRange";
import InstanceType from "./InstanceType";
import { nil } from "../LoxNil";
import GenericParamType from "./GenericParamType";
import GenericParameter from "../GenericParameter";
import GenericType from "./GenericType";
import Superclass from "../Superclass";
import { GenericParamMap } from "./GenericParamMap";

const DEBUG_SCOPE = false;

class StaticError {
    constructor(
        readonly message: string,
        readonly sourceRange: SourceRange,
    ) {}
}

class Scope {
    readonly typeNamespace: Map<string, Type>;
    readonly valueNamespace: Map<string, Type | null>;
    readonly narrowedValueNamespace: Map<string, Type>;
    readonly functions: [FunctionStmt, FunctionContext][];
    constructor(initialProps: Partial<Scope> = {}) {
        this.typeNamespace =
            initialProps.typeNamespace ?? new Map();
        this.valueNamespace =
            initialProps.valueNamespace ?? new Map();
        this.narrowedValueNamespace =
            initialProps.narrowedValueNamespace ?? new Map();
        this.functions =
            initialProps.functions ?? [];
    }

    clone(): Scope {
        return new Scope({
            typeNamespace: new Map(this.typeNamespace),
            valueNamespace: new Map(this.valueNamespace),
            narrowedValueNamespace: new Map(this.narrowedValueNamespace),
            functions: [...this.functions],
        });
    }

    static unionNarrowedTypes(left: Scope, right: Scope): Scope {
        const combinedScope = left.clone();
        combinedScope.narrowedValueNamespace.clear();

        for (const [name, leftType] of left.narrowedValueNamespace) {
            const rightType = right.narrowedValueNamespace.get(name);
            if (rightType) {
                const union = Type.union(leftType, rightType);
                combinedScope.narrowedValueNamespace.set(name, union);
            }
        }

        return combinedScope;
    }
}

class TypeNarrowing {
    constructor(
        readonly name: string,
        readonly type: Type,
    ) {}
}

interface TypeWithNarrowings {
    type: Type;
    narrowings: TypeNarrowing[];
}

interface FunctionContext {
    tag: "FUNCTION" | "INITIALIZER" | "METHOD";
    type: CallableType | GenericType<CallableType>;
}

type ClassContext = "NONE" | "CLASS" | "SUBCLASS";

type ControlFlow =
    | {passable: true; scopes: Scope[]}
    | {passable: false};

const ControlFlow = {
    /**
     * Combines two branches of control flow.
     */
    union(left: ControlFlow, right: ControlFlow): ControlFlow {
        if (left.passable && right.passable) {
            const combinedScopes =
                zip(left.scopes, right.scopes)
                    .map(scopes => Scope.unionNarrowedTypes(...scopes));
            return {passable: true, scopes: combinedScopes};

        } else if (left.passable) {
            return left;

        } else if (right.passable) {
            return right;
        }

        return {passable: false};
    },
};

interface VariableSite {
    wideType: Type;
    narrowType: Type;
    depth: number | null;
}

export default class TypeChecker
implements ExprVisitor<Type>, StmtVisitor<ControlFlow>, TypeExprVisitor<Type> {
    private scopes: Scope[] = [this.globalScope()];
    private currentFunction: FunctionContext | null = null;
    private currentClass: ClassContext = "NONE";
    private errors: StaticError[] = [];

    constructor(
        private readonly interpreter: Interpreter,
    ) {}

    globalScope(): Scope {
        return new Scope({
            typeNamespace: new Map(Object.entries(types)),
            valueNamespace: new Map(Object.entries(globalsTypes)),
        });
    }

    private cloneScopes(): Scope[] {
        return this.scopes.map(scope => scope.clone());
    }

    private beginScope(): void {
        this.scopes.unshift(new Scope());
    }

    private endScope(): void {
        this.checkDeferredFunctionBodies();
        this.debugScope();
        this.scopes.shift();
    }

    private isInGlobalScope(): boolean {
        return this.scopes.length === 1;
    }

    private passable(): ControlFlow {
        return {passable: true, scopes: this.scopes};
    }

    checkProgram(stmts: Stmt[]): StaticError[] {
        const scopesSnapshot = this.cloneScopes();
        this.errors = [];
        this.checkStmts(stmts);
        this.checkDeferredFunctionBodies();
        this.debugScope();
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

    private checkStmts(stmts: Stmt[]): ControlFlow {
        let passable = true;

        for (const stmt of stmts) {
            const stmtControlFlow = this.checkStmt(stmt);
            passable = passable && stmtControlFlow.passable;
        }
        return {passable, scopes: this.scopes};
    }

    private checkStmt(stmt: Stmt): ControlFlow {
        const controlFlow = stmt.accept(this);
        return controlFlow;
    }

    private validateExprType(
        expr: Expr,
        exprType: Type,
        expectedType: Type,
        generics: GenericParamMap | null = null,
    ): boolean {
        if (Type.unify(expectedType, exprType, generics)) {
            return true;
        } else {
            this.error(
                "Incorrect type. " +
                `Expected '${expectedType}', but found '${exprType}'.`,
                expr,
            );
            return false;
        }
    }

    private checkExpr(expr: Expr, expectedType: Type | null = null): Type {
        const exprType = expr.accept(this);
        if (expectedType) {
            const isValid = this.validateExprType(expr, exprType, expectedType);
            if (!isValid) return types.PreviousTypeError;
        }
        return exprType;
    }

    private checkExprWithNarrowing(
        expr: Expr,
        expectedType: Type | null = null,
    ): TypeWithNarrowings {
        let type: Type;
        let narrowings: TypeNarrowing[];

        if (expr instanceof BinaryExpr) {
            ({type, narrowings} = this.visitBinaryExprWithNarrowing(expr));
        } else if (expr instanceof CallExpr) {
            ({type, narrowings} = this.visitCallExprWithNarrowing(expr));
        } else if (expr instanceof GroupingExpr) {
            ({type, narrowings} = this.visitGroupingExprWithNarrowing(expr));
        } else if (expr instanceof LogicalExpr) {
            ({type, narrowings} = this.visitLogicalExprWithNarrowing(expr));
        } else if (expr instanceof UnaryExpr) {
            ({type, narrowings} = this.visitUnaryExprWithNarrowing(expr));
        } else if (expr instanceof VariableExpr) {
            ({type, narrowings} = this.visitVariableExprWithNarrowing(expr));
        } else {
            type = expr.accept(this);
            narrowings = [];
        }

        if (expectedType) this.validateExprType(expr, type, expectedType);

        return {type, narrowings};
    }

    private invertNarrowings(narrowings: TypeNarrowing[]): TypeNarrowing[] {
        return narrowings.map(({name, type: narrowedType}) => {
            const unnarrowedVariable = this.lookupValue(name);
            if (unnarrowedVariable === null) {
                throw new ImplementationError(
                    `Unable to find the variable '${name}' ` +
                    "while inverting a type narrowing.",
                );
            }
            return new TypeNarrowing(
                name,
                Type.complement(unnarrowedVariable.narrowType, narrowedType),
            );
        });
    }

    /**
     * Given two arrays of type narrowings, this combines them by calculating
     * the intersection of the types for any variables which appear in both
     * arrays. Any variables which only appear in one of the arrays will be
     * included unchanged.
     */
    private intersectNarrowings(
        leftNarrowings: TypeNarrowing[],
        rightNarrowings: TypeNarrowing[],
    ): TypeNarrowing[] {
        const narrowingsByName = groupBy(
            leftNarrowings.concat(rightNarrowings),
            n => n.name,
        );
        return (
            Array.from(narrowingsByName)
                .map(([name, narrowingsForName]) => {
                    const type =
                        narrowingsForName
                            .map(n => n.type)
                            .reduce((typeA, typeB) =>
                                Type.intersection(typeA, typeB) ??
                                types.PreviousTypeError);
                    return {name, type};
                })
        );
    }

    /**
     * Given two arrays of type narrowings, this combines them by omitting
     * any variables which only appear in one of the arrays and taking the
     * union of the types for any variables which appear in both.
     */
    private unionNarrowings(
        leftNarrowings: TypeNarrowing[],
        rightNarrowings: TypeNarrowing[],
    ): TypeNarrowing[] {
        const rightNarrowingsByName = groupBy(rightNarrowings, n => n.name);
        return leftNarrowings.flatMap(({name, type: leftType}) => {
            const rightNarrowingsForName = rightNarrowingsByName.get(name);
            if (!rightNarrowingsForName) return [];
            const rightTypes = rightNarrowingsForName.map(n => n.type);
            const type = rightTypes.reduce(Type.union, leftType);
            return [{name, type}];
        });
    }

    private usingNarrowings<T>(narrowings: TypeNarrowing[], body: () => T): T {
        const oldScopes = this.scopes;
        const newScopes = this.cloneScopes();
        for (const {name, type} of narrowings) {
            for (const scope of newScopes) {
                if (scope.valueNamespace.has(name)) {
                    scope.narrowedValueNamespace.set(name, type);
                    break;
                }
            }
        }
        this.scopes = newScopes;
        const result = body();
        this.scopes = oldScopes;
        return result;
    }

    private branch(
        narrowings: TypeNarrowing[],
        leftBranch: () => ControlFlow,
        rightBranch: () => ControlFlow,
    ): ControlFlow {
        const originalScopes = this.scopes;
        const invertedNarrowings = this.invertNarrowings(narrowings);

        const leftControlFlow =
            this.usingNarrowings(narrowings, leftBranch);

        const rightControlFlow =
            this.usingNarrowings(invertedNarrowings, rightBranch);

        const controlFlow =
            ControlFlow.union(leftControlFlow, rightControlFlow);

        if (controlFlow.passable) {
            this.scopes = controlFlow.scopes;
        } else {
            this.scopes = originalScopes;
        }

        return controlFlow;
    }

    private getFunctionType(
        func: FunctionStmt,
    ): CallableType | GenericType<CallableType> {
        this.beginScope();

        const genericParams = this.defineGenericParams(func.genericParams);

        const paramTypes =
            func.params.map(param => this.evaluateTypeExpr(param.type));

        const returnType =
            func.returnType ? this.evaluateTypeExpr(func.returnType) : null;

        this.endScope();

        const callable = new CallableType(paramTypes, returnType);

        return GenericType.wrap(genericParams, callable);
    }

    private checkFunctionBody(
        func: FunctionStmt,
        context: FunctionContext,
    ): void {
        const enclosingFunction = this.currentFunction;
        this.currentFunction = context;

        // Because the function may be called long after it is defined,
        // the narrowed types that are currently inferred may no longer
        // apply when it is called. To maintain soundness, we suspend all
        // narrowed types from outer scopes while checking the function
        // body, then restore them afterwards.
        const enclosingScopes = this.scopes;
        this.scopes = this.cloneScopes();
        for (const scope of this.scopes) {
            scope.narrowedValueNamespace.clear();
        }
        this.beginScope();

        if (context.type instanceof GenericType) {
            const genericParamTypePairs =
                zip(func.genericParams, context.type.params);
            for (const [genericParam, type] of genericParamTypePairs) {
                this.defineType(genericParam.name, type);
            }
        }

        const functionType = GenericType.unwrap(context.type);

        for (const [param, type] of zip(func.params, functionType.params)) {
            this.declareValue(param.name);
            this.defineValue(param.name, type);
        }
        const controlFlow = this.checkStmts(func.body);

        if (controlFlow.passable && functionType.returns !== null) {
            const name = func.name.lexeme;
            this.error(
                `Not all code paths return in the function '${name}'.`,
                func.name,
            );
        }

        this.endScope();
        this.scopes = enclosingScopes;

        this.currentFunction = enclosingFunction;
    }

    // Adds a function to a list to be checked at the end of the scope.
    // Checking function bodies is deferred to allow mutual recursion.
    deferCheckingFunctionBody(
        stmt: FunctionStmt,
        context: FunctionContext,
    ): void {
        this.scopes[0].functions.push([stmt, context]);
    }

    private checkDeferredFunctionBodies(): void {
        const scope = this.scopes[0];

        while (scope.functions.length > 0) {
            const [func, context] =
                scope.functions.shift() as [FunctionStmt, FunctionContext];
            this.checkFunctionBody(func, context);
        }
    }

    private declareValue(name: Token, depth = 0): void {
        const {valueNamespace} = this.scopes[depth];

        if (valueNamespace.has(name.lexeme)) {
            this.error(
                "Variable with this name already declared in this scope.",
                name,
            );
        }

        valueNamespace.set(name.lexeme, null);
    }

    private defineValue(
        name: Token,
        type: Type,
        initialType: Type | null = null,
        depth = 0,
    ): void {
        const scope = this.scopes[depth];
        scope.valueNamespace.set(name.lexeme, type);
        if (initialType) {
            scope.narrowedValueNamespace.set(name.lexeme, initialType);
        }
    }

    private defineType(name: Token, type: Type, depth = 0): void {
        this.scopes[depth].typeNamespace.set(name.lexeme, type);
    }

    private lookupValue(name: string): VariableSite | null {
        for (const [depth, scope] of this.scopes.entries()) {

            const wideType =
                scope.valueNamespace.get(name);

            const narrowType =
                scope.narrowedValueNamespace.get(name);

            if (wideType) {
                return {
                    wideType,
                    narrowType: narrowType ?? wideType,
                    depth,
                };
            }
        }
        return null;
    }

    private resolveName(expr: Expr, name: Token): VariableSite {
        const variableSite = this.lookupValue(name.lexeme);

        if (variableSite === null) {
            this.error(
                `The name '${name.lexeme}' is not defined.`, name);
            return {
                wideType: types.PreviousTypeError,
                narrowType: types.PreviousTypeError,
                depth: null,
            };
        }

        if (variableSite.depth !== null) {
            this.interpreter.resolve(expr, variableSite.depth);
        }
        return variableSite;
    }

    private resolveTypeName(name: Token): Type {
        for (const scope of this.scopes) {
            const type = scope.typeNamespace.get(name.lexeme);
            if (type) return type;
        }

        return this.error(`The type '${name.lexeme}' is not defined.`, name);
    }

    private evaluateTypeExpr(typeExpr: TypeExpr): Type {
        return typeExpr.accept(this);
    }

    visitVariableTypeExpr(typeExpr: VariableTypeExpr): Type {
        const type = this.resolveTypeName(typeExpr.name);

        if (type instanceof GenericType) {
            const argCount = type.params.length;
            return this.error(
                `Generic type '${typeExpr.name.lexeme}' requires ` +
                `${argCount} type argument${s(argCount)}.`,
                typeExpr,
            );
        }

        return type;
    }

    visitGenericTypeExpr(typeExpr: GenericTypeExpr): Type {
        const genericType = this.resolveTypeName(typeExpr.name);

        if (genericType === types.PreviousTypeError) {
            return types.PreviousTypeError;
        }

        if (!(genericType instanceof GenericType)) {
            return this.error(
                `The type '${typeExpr.name.lexeme}' is not generic.`,
                typeExpr,
            );
        }

        return this.instantiateGenericType(genericType, typeExpr);
    }

    private instantiateGenericType(
        genericType: GenericType,
        node: GenericTypeExpr | Superclass | CallExpr,
    ): Type {
        const args = node.genericArgs.map(arg => this.evaluateTypeExpr(arg));

        const {errors, type} = genericType.instantiate(args);

        for (const error of errors) {
            this.error(error, node);
        }

        return type;
    }

    visitCallableTypeExpr(typeExpr: CallableTypeExpr): Type {
        this.beginScope();

        const genericParams = this.defineGenericParams(typeExpr.genericParams);

        const params =
            typeExpr.paramTypes.map(param => this.evaluateTypeExpr(param));

        const returns =
            typeExpr.returnType ?
                this.evaluateTypeExpr(typeExpr.returnType) : null;

        this.endScope();

        return GenericType.wrap(
            genericParams, new CallableType(params, returns));
    }

    visitUnionTypeExpr(typeExpr: UnionTypeExpr): Type {
        const left = this.evaluateTypeExpr(typeExpr.left);
        const right = this.evaluateTypeExpr(typeExpr.right);

        return Type.union(left, right) ?? types.Any;
    }


    visitBlockStmt(stmt: BlockStmt): ControlFlow {
        this.beginScope();
        const controlFlow = this.checkStmts(stmt.statements);
        this.endScope();
        return controlFlow;
    }

    visitClassStmt(stmt: ClassStmt): ControlFlow {
        const enclosingClass = this.currentClass;
        this.currentClass = "CLASS";

        this.declareValue(stmt.name);

        // Create a scope to contain the generic parameters and "super".
        // At runtime, this scope will be created when the class is defined.
        this.beginScope();
        const genericParams = this.defineGenericParams(stmt.genericParams);

        let superType: ClassType | null = null;

        if (stmt.superclass) {
            this.currentClass = "SUBCLASS";

            if (stmt.name.lexeme === stmt.superclass.expr.name.lexeme) {
                this.error(
                    "A class cannot inherit from itself.",
                    stmt.superclass,
                );
            } else {
                let potentialSuperType = this.checkExpr(stmt.superclass.expr);

                if (potentialSuperType instanceof GenericType) {
                    potentialSuperType = this.instantiateGenericType(
                        potentialSuperType,
                        stmt.superclass,
                    );
                }

                if (potentialSuperType instanceof ClassType) {
                    superType = potentialSuperType;
                } else {
                    const superclassName = stmt.superclass.expr.name.lexeme;
                    this.error(
                        `Cannot inherit from '${superclassName}' ` +
                        "because it is not a class.",
                        stmt.superclass.expr,
                    );
                }
            }
        }

        const classType = new ClassType(stmt.name.lexeme, {
            genericArgs: genericParams,
            superclass: superType,
        });

        // The class needs to be defined in the parent scope, not the current
        // local class scope, so we use a depth of 1 instead of 0.
        const depth = 1;

        this.defineValue(
            stmt.name,
            GenericType.wrap(genericParams, classType),
            null,
            depth,
        );
        this.defineType(
            stmt.name,
            GenericType.wrap(genericParams, classType.instance()),
            depth,
        );

        classType.fields = this.getFieldTypes(stmt.fields);
        classType.methods = this.getMethodTypes(stmt.methods);

        if (superType) {
            this.scopes[0].valueNamespace.set("super", superType.instance());
        }

        // Create an inner scope to contain "this". At runtime, this scope
        // will be created when the method is bound.
        this.beginScope();
        this.scopes[0].valueNamespace.set("this", classType.instance());

        this.checkMethods(stmt.methods, classType);

        this.endScope();
        this.endScope();

        this.currentClass = enclosingClass;

        return this.passable();
    }

    private defineGenericParams(
        genericParams: GenericParameter[],
    ): GenericParamType[] {
        const genericParamTypes = [];

        for (const {name} of genericParams) {
            const type = new GenericParamType(name.lexeme);
            this.defineType(name, type);
            genericParamTypes.push(type);
        }

        return genericParamTypes;
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

            const methodType = classType.findMember(name);

            if (
                methodType &&
                GenericType.unwrap(methodType) instanceof CallableType
            ) {
                const contextTag = name === "init" ? "INITIALIZER" : "METHOD";

                const context: FunctionContext = {
                    tag: contextTag,
                    type: methodType as CallableType | GenericType<CallableType>,
                };
                this.checkFunctionBody(method, context);
            } else {
                throw new ImplementationError(
                    `Unable to find callable type for method '${name}' ` +
                    "in class.",
                );
            }
        }
    }

    visitExpressionStmt(stmt: ExpressionStmt): ControlFlow {
        this.checkExpr(stmt.expression);
        return this.passable();
    }

    visitFunctionStmt(stmt: FunctionStmt): ControlFlow {
        const type = this.getFunctionType(stmt);
        this.declareValue(stmt.name);
        this.defineValue(stmt.name, type);

        const context: FunctionContext =  {
            tag: "FUNCTION",
            type: type,
        };

        // functions in the global scope can be mutually recursive,
        // so we defer checking their bodies until the end of the file.
        if (this.isInGlobalScope()) {
            this.deferCheckingFunctionBody(stmt, context);
        } else {
            this.checkFunctionBody(stmt, context);
        }
        return this.passable();
    }

    visitIfStmt(stmt: IfStmt): ControlFlow {
        const {narrowings} = this.checkExprWithNarrowing(stmt.condition);

        return this.branch(
            narrowings,
            () => this.checkStmt(stmt.thenBranch),
            () => stmt.elseBranch
                ? this.checkStmt(stmt.elseBranch)
                : this.passable(),
        );
    }

    visitPrintStmt(stmt: PrintStmt): ControlFlow {
        this.checkExpr(stmt.expression);
        return this.passable();
    }

    visitReturnStmt(stmt: ReturnStmt): ControlFlow {
        const functionType =
            this.currentFunction &&
            GenericType.unwrap(this.currentFunction.type);

        if (functionType === null) {
            this.error("Cannot return from top-level code.", stmt.keyword);
        } else if (stmt.value) {
            if (this.currentFunction?.tag === "INITIALIZER") {
                this.error(
                    "Cannot return a value from an initializer.", stmt.keyword);
            } else if (functionType.returns === null) {
                this.error(
                    "Cannot return a value from this function because " +
                    "there is no declared return type.",
                    stmt.value,
                );
            }
            this.checkExpr(stmt.value, functionType.returns);
        } else if (functionType.returns !== null) {
            this.error(
                "This function cannot return without a value.",
                stmt.keyword,
            );
        }
        return {passable: false};
    }

    visitTypeStmt(stmt: TypeStmt): ControlFlow {
        this.beginScope();
        const genericParams = this.defineGenericParams(stmt.genericParams);
        const body = this.evaluateTypeExpr(stmt.type);
        const type = GenericType.wrap(genericParams, body);
        this.endScope();

        this.defineType(stmt.name, type);

        return this.passable();
    }

    visitVarStmt(stmt: VarStmt): ControlFlow {
        this.declareValue(stmt.name);

        const declaredType =
            stmt.type ? this.evaluateTypeExpr(stmt.type) : null;

        const initializerType =
            stmt.initializer ?
                this.checkExpr(stmt.initializer, declaredType) : null;

        const type = declaredType ?? initializerType ?? types.Any;

        const initialNarrowedType =
            declaredType === types.PreviousTypeError ? null : initializerType;

        this.defineValue(stmt.name, type, initialNarrowedType);

        return this.passable();
    }

    visitWhileStmt(stmt: WhileStmt): ControlFlow {
        const {narrowings} = this.checkExprWithNarrowing(stmt.condition);

        return this.branch(
            narrowings,
            () => this.checkStmt(stmt.body),
            () => (this.passable()),
        );
    }

    visitArrayExpr(expr: ArrayExpr): Type {
        if (expr.items.length === 0) {
            return this.error(
                "Unable to determine the item type for an empty array literal. " +
                "Please use 'Array[Type]()' instead.",
                expr,
            );
        }
        const itemType = expr.items.map(item => this.checkExpr(item)).reduce(Type.union);
        return types.Array.instantiate([itemType]).type;
    }

    visitAssignExpr(expr: AssignExpr): Type {
        const variable = this.resolveName(expr, expr.name);
        const assignedType = this.checkExpr(expr.value);

        // Allow assigning to the original type of the variable, not the
        // narrowed type.
        const isValid =
            this.validateExprType(expr.value, assignedType, variable.wideType);

        // Alter the narrowed type for the remainder of this scope to reflect
        // the assigned value.
        if (isValid && variable.depth !== null) {
            const scope = this.scopes[variable.depth];
            scope.narrowedValueNamespace.set(expr.name.lexeme, assignedType);
        }

        return isValid ? assignedType : variable.wideType;
    }

    private visitBinaryExprWithNarrowing(expr: BinaryExpr): TypeWithNarrowings {

        let narrowings: TypeNarrowing[] = [];

        if (
            expr.operator.type === "BANG_EQUAL" &&
            expr.right instanceof LiteralExpr &&
            expr.right.value === nil &&
            expr.left instanceof VariableExpr
        ) {
            const name = expr.left.name.lexeme;
            const variable = this.lookupValue(name);
            if (variable !== null) {
                narrowings = [
                    new TypeNarrowing(
                        name,
                        Type.complement(variable.narrowType, types.Nil),
                    ),
                ];
            }
        } else if (
            expr.operator.type === "EQUAL_EQUAL" &&
            expr.right instanceof LiteralExpr &&
            expr.right.value === nil &&
            expr.left instanceof VariableExpr
        ) {
            const name = expr.left.name.lexeme;
            const variable = this.lookupValue(name);
            if (variable !== null) {
                narrowings = [
                    new TypeNarrowing(
                        name,
                        types.Nil,
                    ),
                ];
            }
        }
        // TODO other cases (null != x) (null == x)

        return {
            type: this.checkExpr(expr),
            narrowings,
        };
    }

    visitBinaryExpr(expr: BinaryExpr): Type {
        switch (expr.operator.type) {
            case "PLUS": {
                const leftType = this.checkExpr(expr.left);

                if (leftType === types.PreviousTypeError) {
                    this.checkExpr(expr.right);
                    return types.PreviousTypeError;
                }

                for (const plusType of [types.Number, types.String]) {
                    if (Type.unify(plusType, leftType)) {
                        this.checkExpr(expr.right, plusType);
                        return plusType;
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
                this.checkExpr(expr.left, types.Number);
                this.checkExpr(expr.right, types.Number);
                return types.Number;

            case "GREATER":
            case "GREATER_EQUAL":
            case "LESS":
            case "LESS_EQUAL":
                this.checkExpr(expr.left, types.Number);
                this.checkExpr(expr.right, types.Number);
                return types.Boolean;

            case "EQUAL_EQUAL":
            case "BANG_EQUAL":
                this.checkExpr(expr.left);
                this.checkExpr(expr.right);
                // TODO detect disjoint types and warn of constant result
                return types.Boolean;
        }

        // Unreachable
        throw new ImplementationError(
            `Unexpected binary operator: ${expr.operator.lexeme}`);
    }

    private lookupMemberType(expr: GetExpr | SetExpr): Type {
        const objectType = this.checkExpr(expr.object);
        const memberType = objectType.get(expr.name.lexeme);

        if (memberType === null && objectType !== types.PreviousTypeError) {
            this.error(
                `Type '${objectType}' has no property '${expr.name.lexeme}'.`,
                expr.name,
            );
        }

        return memberType ?? types.PreviousTypeError;
    }

    visitGetExpr(expr: GetExpr): Type {
        return this.lookupMemberType(expr);
    }

    visitCallExprWithNarrowing(expr: CallExpr): TypeWithNarrowings {
        let calleeType = this.checkExpr(expr.callee);

        // Check that the callee is callable.

        let callable = GenericType.unwrap(calleeType).callable;

        if (callable === null) {
            if (calleeType !== types.PreviousTypeError) {
                this.error(
                    `Type '${calleeType}' is not callable.`, expr.callee);
            }
            for (const arg of expr.args) {
                this.checkExpr(arg);
            }
            return {
                type: types.PreviousTypeError,
                narrowings: [],
            };
        }

        // Instantiate the generics if generic arguments have been explicitly
        // provided.

        if (expr.genericArgs.length > 0) {
            if (calleeType instanceof GenericType) {
                calleeType = this.instantiateGenericType(calleeType, expr);
                callable = calleeType.callable;
                if (callable === null) {
                    throw new ImplementationError(
                        "Callee is no longer callable after generic " +
                        "instantiation.",
                    );
                }
            } else {
                this.error(
                    `The type '${calleeType}' is not generic.`,
                    expr.callee,
                );
            }
        }

        // Check that the correct number of arguments were provided.

        const args = expr.args;
        let params: (Type | null)[] = callable.params;

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
            params = padArrayEnd(params, args.length, null);

        } else if (args.length < params.length) {
            this.error(
                "Too few arguments for function call. Expected " +
                `${params.length} arguments, but only found ${args.length}.`,
                expr,
            );
        }

        // Type-check the arguments to the function, while inferring
        // concrete types for any generic parameters.

        let generics: GenericParamMap | null = null;

        if (calleeType instanceof GenericType) {
            generics = new Map(zip(
                calleeType.params,
                Array(calleeType.params.length).fill(null),
            ));
        }

        const argTypes: Type[] = [];

        for (const [arg, paramType] of zip(args, params)) {
            const argType = arg.accept(this);
            argTypes.push(argType);
            if (paramType) {
                this.validateExprType(arg, argType, paramType, generics);
            }
        }

        // Use the inferred types to instantiate the generic function type.

        if (calleeType instanceof GenericType) {

            const inferredGenerics =
                calleeType.params.map(param =>
                    generics &&
                    this.resolveBoundGeneric(generics, param) ||
                    this.error(
                        "Unable to infer a type for the generic parameter " +
                            `'${param.name}'. Please provide the type ` +
                            "explicitly.",
                        expr,
                    ),
                );

            callable = (
                calleeType
                    .instantiate(inferredGenerics)
                    .type
                    .callable
            );

            if (callable === null) {
                throw new ImplementationError(
                    "Callee is no longer callable after generic instantiation.",
                );
            }
        }

        // If necessary, produce type narrowings which can be inferred from
        // the result of the call.

        const narrowings: TypeNarrowing[] = [];

        if (callable.produceNarrowings) {
            const argNarrowings = callable.produceNarrowings(argTypes);

            for (const [index, type] of argNarrowings.entries()) {
                const arg = expr.args[index];
                if (arg instanceof VariableExpr) {
                    narrowings.push(new TypeNarrowing(arg.name.lexeme, type));
                }
            }
        }

        const returnType = callable.returns ?? types.Nil;

        return {
            type: returnType,
            narrowings,
        };
    }

    /**
     * Since a generic parameter may be unified with another generic parameter
     * which is then unified with a values, we have to recursively keep
     * resolving the generics until we find a real type, or null which
     * represents that the parameter was not bound to a type during unification.
     */
    private resolveBoundGeneric(
        generics: GenericParamMap,
        param: GenericParamType,
    ): Type | null {
        const boundType = generics.get(param);
        if (boundType === undefined) {
            throw new ImplementationError(
                `Generic parameter '${param}' is missing from generics map.`);
        }
        if (boundType instanceof GenericParamType && generics.has(boundType)) {
            if (boundType === param) return param;
            return this.resolveBoundGeneric(generics, boundType);
        }
        return boundType;
    }


    visitCallExpr(expr: CallExpr): Type {
        return this.visitCallExprWithNarrowing(expr).type;
    }

    private visitGroupingExprWithNarrowing(
        expr: GroupingExpr,
    ): TypeWithNarrowings {
        return this.checkExprWithNarrowing(expr.expression);
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

    private visitLogicalExprWithNarrowing(
        expr: LogicalExpr,
    ): TypeWithNarrowings {
        const left = this.checkExprWithNarrowing(expr.left);
        let right: TypeWithNarrowings = {
            type: types.PreviousTypeError,
            narrowings: [],
        };
        let narrowings: TypeNarrowing[];

        switch (expr.operator.type) {
            case "AND": {
                this.branch(
                    left.narrowings,
                    () => {
                        right = this.checkExprWithNarrowing(expr.right);
                        return this.passable();
                    },
                    () => {
                        return this.passable();
                    },
                );
                narrowings = this.intersectNarrowings(
                    left.narrowings,
                    right.narrowings,
                );
                break;
            }
            case "OR": {
                this.branch(
                    left.narrowings,
                    () => {
                        return this.passable();
                    },
                    () => {
                        right = this.checkExprWithNarrowing(expr.right);
                        return this.passable();
                    },
                );
                narrowings = this.unionNarrowings(
                    left.narrowings,
                    right.narrowings,
                );
                break;
            }
            default:
                throw new ImplementationError(
                    `Unexpected logical operator: ${expr.operator.type}.`);
        }

        return {type: Type.union(left.type, right.type), narrowings};
    }

    visitLogicalExpr(expr: LogicalExpr): Type {
        return this.visitLogicalExprWithNarrowing(expr).type;
    }

    visitSetExpr(expr: SetExpr): Type {
        const memberType = this.lookupMemberType(expr);
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

        const superType =
            this.resolveName(expr, expr.keyword).narrowType as InstanceType;
        const methodType = superType.classType.findMethod(expr.method.lexeme);

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
            return this.resolveName(expr, expr.keyword).narrowType;
        }
    }

    private visitUnaryExprWithNarrowing(expr: UnaryExpr): TypeWithNarrowings {
        if (expr.operator.type === "BANG") {
            const {narrowings} = this.checkExprWithNarrowing(expr.right);
            return {
                narrowings: this.invertNarrowings(narrowings),
                type: types.Boolean,
            };
        }
        return {
            type: this.checkExpr(expr),
            narrowings: [],
        };
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

    visitVariableExprWithNarrowing(expr: VariableExpr): TypeWithNarrowings {
        const type = this.visitVariableExpr(expr);

        const nonNilType = Type.complement(type, types.Nil);

        const narrowings =
            nonNilType === type
                ? []
                : [new TypeNarrowing(expr.name.lexeme, nonNilType)];

        return {type, narrowings};
    }

    visitVariableExpr(expr: VariableExpr): Type {
        if (this.scopes[0].valueNamespace.get(expr.name.lexeme) === null) {
            return this.error(
                "Cannot read local variable in its own initializer.",
                expr.name,
            );
        }
        return this.resolveName(expr, expr.name).narrowType;
    }

    // Records an error when it is possible to continue typechecking
    private error(message: string, target: {sourceRange(): SourceRange}): Type {
        this.errors.push(new StaticError(message, target.sourceRange()));
        return types.PreviousTypeError;
    }

    private debugScope(scope: Scope = this.scopes[0]): void {
        // Print the types of variables in this scope
        if (DEBUG_SCOPE) {
            const indent = Array(this.scopes.length).fill("  ").join("");
            for (const [name, type] of scope.valueNamespace.entries()) {
                console.log(`${indent}${name}: ${type}`);
            }
        }
    }
}
