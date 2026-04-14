const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  pages: {
    index: {
      entry: 'src/main.js',
      // Browser tab title (used by public/index.html via htmlWebpackPlugin.options.title)
      title: 'IT Asset Management',
    },
  },
})
