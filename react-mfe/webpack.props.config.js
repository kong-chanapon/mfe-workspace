const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { container } = require('webpack');

const ModuleFederationPlugin = container.ModuleFederationPlugin;

const loadEnvironment = () => {
  const defaults = {
    props: {
      publicPath: 'http://localhost:4300/',
      port: 4300,
      scope: 'reactRemote',
      remoteEntryFilename: 'remoteEntry.js',
    },
  };

  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'environment.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const props = parsed?.props ?? {};
    return {
      props: {
        publicPath: typeof props.publicPath === 'string' ? props.publicPath : defaults.props.publicPath,
        port: typeof props.port === 'number' ? props.port : defaults.props.port,
        scope: typeof props.scope === 'string' ? props.scope : defaults.props.scope,
        remoteEntryFilename:
          typeof props.remoteEntryFilename === 'string' ? props.remoteEntryFilename : defaults.props.remoteEntryFilename,
      },
    };
  } catch {
    return defaults;
  }
};

const env = loadEnvironment();

module.exports = {
  entry: path.resolve(__dirname, 'src/index.jsx'),
  output: {
    publicPath: env.props.publicPath,
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
      name: env.props.scope,
      filename: env.props.remoteEntryFilename,
      exposes: {
        './mount': './src/mount.jsx',
      },
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
    }),
  ],
  devServer: {
    port: env.props.port,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    hot: true,
  },
};
