const webpack = require('webpack');

module.exports = function override(config, env) {
  // Disable error overlay in production
  if (env === 'production') {
    config.devServer = {
      ...config.devServer,
      client: {
        overlay: false,
      },
    };
  }

  // Ignore source map warnings
  config.ignoreWarnings = [/Failed to parse source map/];

  // Add plugin to suppress errors
  config.plugins.push(
    new webpack.DefinePlugin({
      'process.env.REACT_APP_ENV': JSON.stringify(env),
    })
  );

  return config;
};
