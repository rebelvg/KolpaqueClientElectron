const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const { name } = require('../package.json');

module.exports = {
  mode: 'development',
  target: 'electron-renderer',
  entry: './src/index.tsx',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(jpe?g|gif|png|wav|mp3)$/,
        include: [path.resolve(__dirname, './icons')],
        loader: 'url-loader',
        options: {
          limit: 8192,
        },
      },
      {
        test: /\.(woff|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        include: [path.resolve(__dirname, './icons')],
        loader: 'file-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: name,
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.IgnorePlugin({ resourceRegExp: /^(fs|ipc)$/ }),
  ],
  devtool: 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devServer: {
    hot: true,
    host: 'localhost',
    historyApiFallback: true,
    devMiddleware: {
      publicPath: '/',
    },
    port: 10000,
  },
};
