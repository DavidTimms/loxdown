module.exports = {
    root: true,
    parser: "@typescript-eslint/parser",
    plugins: [
        "@typescript-eslint",
    ],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
    ],
    rules: {
        "@typescript-eslint/no-use-before-define": "off",

        "eqeqeq": ["error", "always"],

        "comma-dangle": ["warn", {
            "arrays": "always-multiline",
            "objects": "always-multiline",
            "imports": "always-multiline",
            "exports": "always-multiline",
            "functions": "always-multiline",
        }],
        "quotes": ["warn", "double"],
        "semi": ["error", "always"],
        "semi-style": ["error", "last"],
        "indent": ["warn", 4, {
            "SwitchCase": 1,
        }],
        "curly": ["warn", "multi-line"],
        "brace-style": ["warn"],
        "no-trailing-spaces": ["warn"],
        "keyword-spacing": ["warn"],
    }
};
