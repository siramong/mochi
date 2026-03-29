"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = require("path");
var vite_1 = require("vite");
var plugin_react_1 = require("@vitejs/plugin-react");
var vite_2 = require("@tailwindcss/vite");
exports.default = (0, vite_1.defineConfig)({
    plugins: [(0, plugin_react_1.default)(), (0, vite_2.default)()],
    resolve: {
        alias: {
            "@": path_1.default.resolve(__dirname, "./src"),
            "react": path_1.default.resolve(__dirname, "./node_modules/react"),
            "react-dom": path_1.default.resolve(__dirname, "./node_modules/react-dom"),
        },
    },
});
