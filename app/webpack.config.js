const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  target: 'electron-renderer',
  entry: [
    'react-hot-loader/patch',
    'webpack-dev-server/client?http://localhost:10000',
    'webpack/hot/only-dev-server',
    './index.tsx',
  ],
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
        include: [path.resolve(__dirname, './static')],
        loader: 'url-loader',
        options: {
          limit: 8192,
        },
      },
      {
        test: /\.(woff|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        include: [path.resolve(__dirname, './static')],
        loader: 'file-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Webpack Dev Server',
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    new webpack.IgnorePlugin(new RegExp('^(fs|ipc)$')),
  ],
  devtool: 'source-map',
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  devServer: {
    hot: true,
    host: 'localhost',
    historyApiFallback: true,
    publicPath: '/',
    port: 10000,
  },
};
