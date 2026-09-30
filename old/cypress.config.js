// Cypress配置文件

module.exports = {
  e2e: {
    baseUrl: 'http://localhost:8080',
    supportFile: false,
    setupNodeEvents(on, config) {
      // 可以在这里添加自定义事件处理器
    }
  }
};
