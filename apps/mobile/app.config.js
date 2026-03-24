const appJson = require('./app.json')
const withHealthConnectPermissionDelegate = require('./plugins/with-health-connect-permission-delegate.js')

module.exports = () => {
  const baseConfig = appJson.expo
  const basePlugins = Array.isArray(baseConfig.plugins) ? baseConfig.plugins : []

  const plugins = basePlugins.filter((plugin) => {
    if (typeof plugin !== 'string') return true
    return plugin !== './plugins/with-health-connect-permission-delegate.js'
  })

  return {
    ...baseConfig,
    plugins: [...plugins, withHealthConnectPermissionDelegate],
  }
}
