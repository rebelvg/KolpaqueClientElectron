const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: [
        'react-hot-loader/patch',
        'webpack-dev-server/client?http://localhost:3000',
        'webpack/hot/only-dev-server',
        './src/index.js'
    ],
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /(node_modules|bower_components)/,
                include: [path.resolve(__dirname, 'src')],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            'env',
                            'react',
                            'stage-0',
                            'es2015',
                            'es2016',
                            'es2017'
                        ],
                        plugins: [
                            'react-hot-loader/babel',
                            'transform-class-properties',
                            'transform-decorators-legacy'
                        ]
                    }
                }
            },
            {
                test: /\.(jpe?g|gif|png|wav|mp3)$/,
                loader: 'url-loader',
                options: {
                    limit: 8192
                }
            },
            {
                test: /\.(woff|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                include: [path.resolve(__dirname, 'static')],
                loader: "file-loader"
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.IgnorePlugin(new RegExp('^(fs|ipc)$'))
    ],
    devtool: 'source-map',
    devServer: {
        hot: true,
        host: 'localhost',
        historyApiFallback: true,
        publicPath: '/',
        port: 3000
    },
    resolve: {
        alias: {
            src: path.resolve(__dirname, './src')
        }
    },
    node: {
        fs: 'empty'
    },
    output: {
        filename: 'dev_bundle.js',
        publicPath: '/',
        path: path.resolve(__dirname, 'dist')
    }
};
