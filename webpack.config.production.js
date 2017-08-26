const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    module: {
        rules: [
            {
                test: /.js/,
                exclude: /(node_modules|bower_components)/,
                include: [
                    path.resolve(__dirname, "src"),
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env', 'react', 'es2015', 'es2016', 'es2017'],
                        plugins: [
                            'transform-class-properties',
                        ],
                    }
                },
            },
            {
                exclude: /(node_modules|bower_components)/,
                include: [
                    path.resolve(__dirname, "src"),
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env', 'react', 'es2015', 'es2016', 'es2017'],
                        plugins: [
                            'transform-class-properties',
                        ],
                    }
                },
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader?modules']
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin(),
    ],
    devtool: 'source-map',
    resolve: {
        alias: {
            src: path.resolve(__dirname, 'src'),
        },
        extensions: ['css', 'js', 'jsx'],
    },
    output: {
        filename: 'bundle.js',
        publicPath: '/',
        path: path.resolve(__dirname, 'dist')
    }
};
