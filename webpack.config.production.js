const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    module: {
        rules: [
            {
                test: /.js/,
                exclude: /node_modules/,
                include: [
                    path.resolve(__dirname, "src"),
                ],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['env', 'stage-0', 'react', 'es2015', 'es2016', 'es2017'],
                        plugins: [
                            'transform-class-properties',
                            'react-html-attrs',
                            'transform-decorators-legacy'
                        ],
                    }
                },
            },
            {
                test: /\.css$/,
                loader: 'style-loader!css-loader'
            },
        ],
    },
    resolve: {
        alias: {
            src: path.resolve(__dirname, './src'),
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: "Kolpaque Client"
        }),
    ],
    output: {
        filename: 'bundle.js',
        publicPath: './',
        path: path.resolve(__dirname, 'dist')
    }
};
