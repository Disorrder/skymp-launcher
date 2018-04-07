import './style.styl';

import * as ini from 'app/utils/iniFile';

const fs = window.require('fs');
const path = window.require('path');
const child_process = window.require('child_process');
const http = require('http');
const extract = window.require('extract-zip');

const skympFilenames = {
    cfg: 'skymp_config.ini',
    starter: 'skymp.bat',
};

var pkg = require('app/../../package.json');

export default {
    template: require('./template.pug')(),
    data() {
        return {
            version: pkg.version,
            versions: window.process.versions,
            debugData: {
                extended: false,
                dirname: __dirname,
            },
            gamePath: '',
            authData: {
                login: '',
                password: '',
            },
        }
    },
    computed: {

    },
    methods: {
        play(e) {
            e.preventDefault();

            this.fetchConfig().then((data) => {
                var oldCfg = this.cfg;
                this.cfg = data;

                if (oldCfg.clientVersion != this.cfg.clientVersion) { // download new version
                    let archivePath = path.join(this.gamePath, 'skymp.zip');
                    return this.downloadZip(this.cfg.clientUrl, archivePath).then(() => {
                        extract(archivePath, {dir: this.gamePath}, err => {
                            console.log('files unzipped', err);
                            if (!err) {
                                this.startGame();
                            }
                        });
                    })
                }

                // old version is valid
                this.startGame();
            });

        },

        fetchConfig() {
            var data = {};
            return new Promise((resolve, reject) => {
                http.get("https://vk.com/page-120925453_53245312", res => {
                    res.setEncoding('utf8');
                    let rawData = '';
                    res.on('data', (chunk) => { rawData += chunk; });
                    res.on('end', () => {
                        data.clientUrl = getValueInDocument(rawData, 'targetURL')
                        data.clientVersion = getValueInDocument(rawData, 'targetVer')
                        data.serverIP = getValueInDocument(rawData, 'serverIP')
                        data.serverPort = getValueInDocument(rawData, 'serverPort')
                        data.serverPassword = getValueInDocument(rawData, 'serverPassword')

                        console.log('fetch cfg', data);
                        resolve(data);
                    })
                });
            });
        },

        downloadZip(url, filename) {
            var file = fs.createWriteStream(filename);
            return new Promise((resolve, reject) => {
                http.get(url, res => {
                    res.pipe(file);
                    res.on('end', () => {
                        resolve();
                    });
                });
            });
        },

        startGame() {
          console.log('[startGame] Writing to ', skympFilenames.cfg)
          this.cfg.name = this.authData.login;
          // this.cfg.server_ip = serverIP
          // this.cfg.server_port = serverPort
          // this.cfg.client_version = clientVersion
          // this.cfg.server_password = serverPassword
          this.cfg.translate = 'ru'
          const cfgPath = path.resolve(this.gamePath, skympFilenames.cfg);
          ini.write(cfgPath, this.cfg);

          const batPath = this.gamePath + '/' + skympFilenames.starter;
          const batStr = 'cd %~dp0\nstart /b skse_loader.exe'
          console.log('[startGame] Writing to ', skympFilenames.starter)
          fs.writeFileSync(batPath, batStr)

          console.log('[startGame] child_process.spawnSync(...)')
          const p = child_process.spawnSync(batPath, []);
        }
    },

    created() {
        this.gamePath = localStorage.gamePath || '';
        if (!this.gamePath) this.$router.push({name: 'settings'});

        const cfgPath = path.resolve(this.gamePath, skympFilenames.cfg)
        this.cfg = ini.read(cfgPath);
        if (this.cfg.name) this.authData.login = this.cfg.name;
    },

    mounted() {
        $('form#auth #login').focus();
    }
};

// utils
function getValueInDocument(chunk, varName) {
  let val = ''
  const beginSearchResult = chunk.search('(' + varName + ')')
  const endSearchResult = chunk.search('(/' + varName + ')')
  if (beginSearchResult != -1 && endSearchResult != -1) {
    const begin = beginSearchResult + ('(' + varName + ')').length;
    const end = endSearchResult - 1;
    val = chunk.substring(begin, end);
  }
  console.log("[getValueInDocument] " +  varName + '=' + val);
  return val
}
