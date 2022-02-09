var path = require("path");
var os = require("os");
var fs = require("fs");
var HtmlWebpackPlugin = require("html-webpack-plugin");
var { TsconfigPathsPlugin } = require("tsconfig-paths-webpack-plugin");

var __DEV__ = process.argv.includes("serve");

//clean previous build output
require("rimraf").sync(path.join(__dirname, "dist"));

module.exports = {
    mode: "development",
    devtool: __DEV__ ? "inline-source-map" : "source-map",
    entry: {
        ocean: path.join(__dirname, "src/index.ts"),
    },
    output: {
        //using [name] allows for code splitting. chunkhash in prod for cash busting
        filename: __DEV__ ? "[name].js" : "[name].[chunkhash].js",
        path: path.join(__dirname, "dist"),
    },
    resolve: {
        extensions: [".ts", ".tsx", ".jsx", ".js"],
        fallback: {
            fs: false,
            path: false,
        },
        plugins: [new TsconfigPathsPlugin()],
    },
    module: {
        rules: [
            {
                test: /\.m?js/,
                resolve: {
                    fullySpecified: false,
                },
            },
            {
                test: /\.(js|mjs|jsx|ts|tsx)$/,
                loader: "source-map-loader",
                enforce: "pre",
            },
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
            },
            {
                test: /\.(png|jpg|gif|env|glb|stl|exr|hdr)$/i,
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 8192,
                        },
                    },
                ],
            },
            {
                test: /\.(wgsl|glsl)$/i,
                use: [
                    {
                        loader: "raw-loader",
                    },
                ],
            },
        ],
    },
    plugins: [
        //new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            inject: true,
            template: path.join(__dirname, "src/index.html"),
        }),
    ],
    devServer: {
        static: {
            directory: path.join(__dirname, "src"),
        },
        open: {
            app: {
                name: getCanaryPath(),
                arguments: ["--enable-unsafe-webgpu"],
            },
        },
    },
};




function getWindowsBrowserCmd() {
    let windowsCanaryPath = path.normalize(
        path.join(
            os.homedir(),
            "AppData/Local/Google/Chrome SxS/Application/chrome.exe"
        )
    );
    let isCanaryInstalled = fs.existsSync(windowsCanaryPath);
    
    let windowsBrowserCmd = isCanaryInstalled
        ? windowsCanaryPath
        : require("open").apps.chrome;

    return windowsBrowserCmd;
}

function getCanaryPath() {
    switch (os.platform) {
        case "win32":
            return getWindowsBrowserCmd();
        case "darwin":
            return require("open").apps.chrome;
        case "linux":
            return require("open").apps.chrome;
        default:
            return require("open").apps.chrome;
    }
}

//I've never owned a mac , someone who has please configure the darwin switch above to return whatever is proper
//https://developers.google.com/web/updates/2017/04/headless-chrome
// alias chrome="/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome"
// alias chrome-canary="/Applications/Google\ Chrome\ Canary.app/Contents/MacOS/Google\ Chrome\ Canary"
// alias chromium="/Applications/Chromium.app/Contents/MacOS/Chromium"
