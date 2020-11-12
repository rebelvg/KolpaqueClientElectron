const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  module: {
    rules: [
      {
        test: /.js/,
        exclude: /node_modules/,
        include: [path.resolve(__dirname, 'src')],
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env', 'stage-0', 'react', 'es2015', 'es2016', 'es2017'],
            plugins: [
              'transform-class-properties',
              'react-html-attrs',
              'transform-decorators-legacy',
            ],
          },
        },
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
      {
        test: /\.(jpe?g|gif|png|wav|mp3)$/,
        include: [path.resolve(__dirname, 'static')],
        loader: 'url-loader',
        options: {
          limit: 8192,
        },
      },
      {
        test: /\.(woff|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        include: [path.resolve(__dirname, 'static')],
        loader: 'file-loader',
      },
    ],
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, './src'),
      static: path.resolve(__dirname, './static'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Kolpaque Client',
    }),
    new CopyWebpackPlugin([{ from: 'static', to: 'static' }]),
  ],
  output: {
    filename: 'bundle.js',
    publicPath: './',
    path: path.resolve(__dirname, 'dist'),
  },
};
