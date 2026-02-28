const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { container } = require('webpack');

const ModuleFederationPlugin = container.ModuleFederationPlugin;

const loadEnvironment = () => {
  const defaults = {
    window: {
      publicPath: 'http://localhost:4301/',
      port: 4301,
      scope: 'reactWindowRemote',
      remoteEntryFilename: 'remoteEntry.js',
    },
  };

  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'environment.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const win = parsed?.window ?? {};
    return {
      window: {
        publicPath: typeof win.publicPath === 'string' ? win.publicPath : defaults.window.publicPath,
        port: typeof win.port === 'number' ? win.port : defaults.window.port,
        scope: typeof win.scope === 'string' ? win.scope : defaults.window.scope,
        remoteEntryFilename:
          typeof win.remoteEntryFilename === 'string' ? win.remoteEntryFilename : defaults.window.remoteEntryFilename,
      },
    };
  } catch {
    return defaults;
  }
};

const env = loadEnvironment();

module.exports = {
  entry: path.resolve(__dirname, 'src/index.window.jsx'),
  output: {
    publicPath: env.window.publicPath,
    clean: true,
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
      },
    ],
  },
  plugins: [
    new ModuleFederationPlugin({
      name: env.window.scope,
      filename: env.window.remoteEntryFilename,
      exposes: {
        './mount': './src/mountWindow.jsx',
      },
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
    }),
  ],
  devServer: {
    port: env.window.port,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    hot: true,
  },
};
