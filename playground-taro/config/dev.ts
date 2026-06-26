import { isWSL } from './platform'

export default {
   logger: {
    quiet: false,
    stats: true
  },
  mini: {},
  h5: {},
  plugins: isWSL() ? [
    [
      'taro-plugin-sync-in-wsl',
      {
        weapp: [
          {
            sourcePath: 'dist',
            outputPath: '/mnt/c/Users/Administrator/opt/htdocs/taro-markstream',
          },
        ],
      },
    ],
  ] : []
}