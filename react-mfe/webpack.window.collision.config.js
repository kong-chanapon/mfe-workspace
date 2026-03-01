const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { container } = require('webpack');

const ModuleFederationPlugin = container.ModuleFederationPlugin;

const loadEnvironment = () => {
  const defaults = {
    windowCollision: {
      publicPath: 'http://localhost:4303/',
      port: 4303,
      scope: 'reactWindowCollisionRemote',
      remoteEntryFilename: 'remoteEntry.js',
    },
  };

  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'environment.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const collision = parsed?.windowCollision ?? {};
    return {
      windowCollision: {
        publicPath:
          typeof collision.publicPath === 'string' ? collision.publicPath : defaults.windowCollision.publicPath,
        port: typeof collision.port === 'number' ? collision.port : defaults.windowCollision.port,
        scope: typeof collision.scope === 'string' ? collision.scope : defaults.windowCollision.scope,
        remoteEntryFilename:
          typeof collision.remoteEntryFilename === 'string'
            ? collision.remoteEntryFilename
            : defaults.windowCollision.remoteEntryFilename,
      },
    };
  } catch {
    return defaults;
  }
};

const env = loadEnvironment();

module.exports = {
  entry: path.resolve(__dirname, 'src/index.window.collision.jsx'),
  output: {
    publicPath: env.windowCollision.publicPath,
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
      name: env.windowCollision.scope,
      filename: env.windowCollision.remoteEntryFilename,
      exposes: {
        './mount': './src/mountWindowCollision.jsx',
      },
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
    }),
  ],
  devServer: {
    port: env.windowCollision.port,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    hot: true,
  },
};
