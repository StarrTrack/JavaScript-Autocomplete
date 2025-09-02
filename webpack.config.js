const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Общие настройки для всех сред
const sharedConfig = {
  entry: './src/index.js',
  resolve: {
    extensions: ['.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      // JavaScript (общее правило)
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: '> 1%, last 2 versions',
                  useBuiltIns: 'usage',
                  corejs: 3,
                },
              ],
            ],
          },
        },
      },

      // SVG — только иконки
      {
        test: /\.svg$/i,
        include: path.resolve(__dirname, 'src/icons'),
        type: 'asset/resource',
        generator: {
          filename: 'icons/[name][ext]',
        },
      },

      {
        test: /\.(png|jpe?g|gif|webp|ico)$/i,
        include: path.resolve(__dirname, 'src/images'),
        type: 'asset/resource',
        generator: {
          filename: 'images/[name][ext]',
        },
      },

      // Шрифты
      {
        test: /\.(eot|ttf|woff|woff2)$/,
        use: [
          {
            loader: 'file-loader?name=./fonts/[name].[ext]',
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html',
      inject: 'body',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'src/icons'),
          to: 'icons',
        },
        {
          from: path.resolve(__dirname, 'src/images'),
          to: 'images',
        },
        {
          from: path.resolve(__dirname, 'src/fonts'),
          to: 'fonts',
        },
      ],
    }),
  ],
};

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  // Конфиг для development
  const developmentConfig = {
    ...sharedConfig,
    mode: 'development',
    devtool: 'eval-source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      chunkFilename: '[name].chunk.js',
      clean: true,
      // publicPath: '/',
    },
    devServer: {
      static: [
        {
          directory: path.join(__dirname, 'dist'),
          publicPath: '/',
        },
        {
          directory: path.join(__dirname, 'src'),
          publicPath: '/src',
        },
      ],
      compress: true,
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true,
    },
    module: {
      ...sharedConfig.module,
      rules: [
        ...sharedConfig.module.rules,
        // Стили для development
        {
          test: /\.(scss|sass|css)$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
                importLoaders: 2,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
                postcssOptions: {
                  plugins: [['autoprefixer']],
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                sassOptions: {
                  outputStyle: 'expanded',
                },
              },
            },
          ],
        },
      ],
    },
    optimization: {
      minimize: false,
    },
    performance: {
      hints: false,
    },
  };

  // Конфиг для production
  const productionConfig = {
    ...sharedConfig,
    mode: 'production',
    devtool: 'source-map',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].[contenthash].js',
      chunkFilename: '[name].[contenthash].chunk.js',
      clean: true,
    },
    plugins: [
      ...sharedConfig.plugins,
      new MiniCssExtractPlugin({
        filename: 'css/[name].[contenthash].css',
        chunkFilename: 'css/[name].[contenthash].chunk.css',
      }),
    ],
    module: {
      ...sharedConfig.module,
      rules: [
        ...sharedConfig.module.rules,
        // Стили для production
        {
          test: /\.(scss|sass|css)$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                sourceMap: true,
                importLoaders: 2,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                sourceMap: true,
                postcssOptions: {
                  plugins: [['autoprefixer']],
                },
              },
            },
            {
              loader: 'sass-loader',
              options: {
                sourceMap: true,
                sassOptions: {
                  outputStyle: 'compressed',
                },
              },
            },
          ],
        },
      ],
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            compress: {
              drop_console: true,
            },
          },
        }),
      ],
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    },
    performance: {
      hints: 'warning',
      maxEntrypointSize: 250000,
      maxAssetSize: 250000,
    },
  };

  return isProduction ? productionConfig : developmentConfig;
};
