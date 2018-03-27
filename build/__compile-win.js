const electronInstaller = require('electron-winstaller');
const path = require('path');

console.log(__dirname);
electronInstaller.createWindowsInstaller({
    appDirectory: '.build',
    outputDirectory: '.compiled',
    authors: 'SkyMP Team <3',
    // exe: 'skymp-launcher.exe'
})
.then(() => {
    console.log("It worked!");
})
.catch((e) => {
    console.log(`No dice: ${e.message}`);
})
;
