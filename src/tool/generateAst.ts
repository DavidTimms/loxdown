#!/usr/bin/env ts-node

import * as fs from "fs";

function main(args: string[]): void {
    if (args.length !== 1) {
        console.error("Usage: tslox-generate-ast <output directory>");
        process.exit(1);
    }
    const outputDir = args[0];

    defineAst(outputDir, "Expr", [
        "Binary   : Expr left, Token operator, Expr right",
        "Grouping : Expr expression",
        "Literal  : LoxValue value",
        "Unary    : Token operator, Expr right",
    ]);
}

function defineAst(outputDir: string, baseName: string, types: string[]): void {
    const path = `${outputDir}/${baseName}.ts`;

    const lines = [
        "// This file is programatically generated. Do not edit it directly.",
        "",
        "import Token from \"./Token\";",
        "import LoxValue from \"./LoxValue\";",
        "",
        `export abstract class ${baseName} {`,
        `    abstract accept<R>(visitor: ${baseName}Visitor<R>): R;`,
        "}",
        "",
        ...defineVisitor(baseName, types),
        "",
        ...types.flatMap(type => {
            const [classPrefix, fields] = type.split(":").map(s => s.trim());
            return defineType(baseName, classPrefix, fields);
        }),
    ];

    fs.writeFileSync(path, lines.join("\n"));
}

function defineType(
    baseName: string,
    classPrefix: string,
    fieldList: string,
): string[] {
    const className = classPrefix + baseName;
    const fields = fieldList.split(", ").map(field => field.split(" "));
    return [
        `export class ${className} extends ${baseName} {`,

        // Constructor with all fields
        "    constructor(",
        ...fields.map(([fieldType, fieldName]) =>
            `        readonly ${fieldName}: ${fieldType},`,
        ),
        "    ) {",
        "        super();",
        ...fields.map(([_, fieldName]) =>
            `        this.${fieldName} = ${fieldName};`,
        ),
        "    }",
        "",

        // Visitor pattern
        `    accept<R>(visitor: ${baseName}Visitor<R>): R {`,
        `        return visitor.visit${className}(this);`,
        "    }",

        "}",
        "",
    ];
}

function defineVisitor(baseName: string, types: string[]): string[] {
    return [
        `export interface ${baseName}Visitor<R> {`,
        ...types.map(type => {
            const classPrefix = type.split(":")[0].trim();
            const className = classPrefix + baseName;
            const method = `visit${className}`;
            return `    ${method}(${baseName.toLowerCase()}: ${className}): R;`;
        }),
        "}",
    ];
}

main(process.argv.slice(2));
