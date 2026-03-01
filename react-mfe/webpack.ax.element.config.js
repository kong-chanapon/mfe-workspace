const path = require('path');
const fs = require('fs');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const loadEnvironment = () => {
  const defaults = {
    axElement: {
      publicPath: 'http://localhost:4305/',
      port: 4305,
      scriptFilename: 'ma-react-ax-remote.js',
    },
  };

  try {
    const raw = fs.readFileSync(path.resolve(__dirname, 'environment.json'), 'utf8');
    const parsed = JSON.parse(raw);
    const axElement = parsed?.axElement ?? {};

    return {
      axElement: {
        publicPath: typeof axElement.publicPath === 'string' ? axElement.publicPath : defaults.axElement.publicPath,
        port: typeof axElement.port === 'number' ? axElement.port : defaults.axElement.port,
        scriptFilename:
          typeof axElement.scriptFilename === 'string' ? axElement.scriptFilename : defaults.axElement.scriptFilename,
      },
    };
  } catch {
    return defaults;
  }
};

const env = loadEnvironment();

module.exports = {
  entry: path.resolve(__dirname, 'src/index.ax.element.jsx'),
  output: {
    publicPath: env.axElement.publicPath,
    filename: env.axElement.scriptFilename,
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
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'src/index.html'),
    }),
  ],
  devServer: {
    port: env.axElement.port,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    hot: true,
  },
};
