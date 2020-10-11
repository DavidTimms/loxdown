/* eslint-disable @typescript-eslint/no-var-requires */

const path = require("path");

module.exports = {
    entry: "./built/web/playground.js",
    output: {
        filename: "playground.js",
        path: path.resolve(__dirname, "web", "js"),
    },
};
