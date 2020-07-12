#!/usr/bin/env ts-node

import * as fs from "fs";

interface ClassDefinition {
    baseName: string;
    className: string;
    fields: {
        types: string[];
        name: string;
    }[];
}

function main(args: string[]): void {
    if (args.length !== 1) {
        console.error("Usage: tslox-generate-ast <output directory>");
        process.exit(1);
    }
    const outputDir = args[0];

    defineAst(outputDir, "Expr", [
        "Assign   -> name: Token, value: Expr",
        "Binary   -> left: Expr, operator: Token, right: Expr",
        "Call     -> callee: Expr, paren: Token, args: Expr[]",
        "Get      -> object: Expr, name: Token",
        "Grouping -> expression: Expr",
        "Literal  -> value: LoxValue",
        "Logical  -> left: Expr, operator: Token, right: Expr",
        "Set      -> object: Expr, name: Token, value: Expr",
        "Super    -> keyword: Token, method: Token",
        "This     -> keyword: Token",
        "Unary    -> operator: Token, right: Expr",
        "Variable -> name: Token",
    ]);

    defineAst(outputDir, "Stmt", [
        "Block      -> statements: Stmt[]",
        `Class      -> name: Token,
                       superclass: VariableExpr | null,
                       methods: FunctionStmt[]`,
        "Expression -> expression: Expr",
        `Function   -> name: Token,
                       params: Parameter[],
                       returnType: TypeExpr | null,
                       body: Stmt[]`,
        `If         -> condition: Expr,
                       thenBranch: Stmt,
                       elseBranch: Stmt | null`,
        "Print      -> expression: Expr",
        `Return     -> keyword: Token,
                       value: Expr | null`,
        `Var        -> name: Token,
                       type: TypeExpr | null,
                       initializer: Expr | null`,
        `While      -> condition: Expr,
                       body: Stmt`,
    ]);

    defineAst(outputDir, "TypeExpr", [
        "Variable   -> name: Token",
    ]);
}

function defineAst(outputDir: string, baseName: string, types: string[]): void {
    const path = `${outputDir}/${baseName}.ts`;

    const classDefs = types.map(type => parseClassDefinition(baseName, type));


    const globalEnv = new Set([
        "null",
        baseName,
        ...classDefs.map(({className}) => className),
    ]);

    const importedTypes = new Set(
        classDefs
            .flatMap(({fields}) => fields)
            .flatMap(({types}) => types)
            .flatMap(type => type.match(/\w+/g) || [])
            .filter(identifier => !globalEnv.has(identifier)),
    );

    const lines = [
        "// This file is programatically generated. Do not edit it directly.",
        "",
        ...Array.from(importedTypes)
            .map(type => `import ${type} from "./${type}";`),
        "",
        ...classDefs.flatMap(defineType),
        `export type ${baseName} =`,
        classDefs.map(({className}) => "    " + className).join(" |\n") + ";",
        "",
        `export default ${baseName};`,
        "",
        ...defineVisitor(baseName, classDefs),
        "",
    ];

    fs.writeFileSync(path, lines.join("\n"));
}

function defineType({baseName, className, fields}: ClassDefinition): string[] {
    return [
        `export class ${className} {`,

        // Constructor with all fields
        "    constructor(",
        ...fields.map(({types, name}) =>
            `        readonly ${name}: ${types.join(" | ")},`,
        ),
        "    ) {}",
        "",

        // Visitor pattern
        `    accept<R>(visitor: ${baseName}Visitor<R>): R {`,
        `        return visitor.visit${className}(this);`,
        "    }",

        "}",
        "",
    ];
}

function defineVisitor(
    baseName: string,
    classDefs: ClassDefinition[],
): string[] {
    return [
        `export interface ${baseName}Visitor<R> {`,
        ...classDefs.map(({className}) => {
            const method = `visit${className}`;
            return `    ${method}(${baseName.toLowerCase()}: ${className}): R;`;
        }),
        "}",
    ];
}

function parseClassDefinition(
    baseName: string,
    definition: string,
): ClassDefinition {
    const [classPrefix, fieldList] = definition.split("->").map(s => s.trim());
    const className = classPrefix + baseName;
    const fields = fieldList.split(",").map(field => {
        const [name, typeList] = field.split(":").map(s => s.trim());
        return {name, types: typeList.split("|").map(s => s.trim())};
    });

    return {baseName, className, fields};
}

main(process.argv.slice(2));
