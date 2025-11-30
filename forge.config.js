module.exports = {
  packagerConfig: {
    asar: true,
    executableName: 'MonitorAgent',
    icon: './assets/icon', // 不需要副檔名，Electron Packager 會自動選擇適合的平台格式
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'MonitorAgent',
        authors: 'CMUBH',
        description: 'A service agent monitoring application (Legacy - Windows 7+ support)',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'win32'],
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
