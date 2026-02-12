const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'production',
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
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Kolpaque Client',
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, './icons'), to: 'icons' }],
    }),
  ],
  output: {
    filename: 'bundle.js',
    publicPath: './',
    path: path.resolve(__dirname, './dist'),
  },
};
