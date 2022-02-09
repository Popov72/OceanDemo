module.exports = {
    root: true,
    ignorePatterns: ["node_modules", "dist", "webpack.*"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended",
    ],
};
