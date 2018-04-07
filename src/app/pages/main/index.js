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
            currentMessage: {
                status: 'ok',
                text: ''
            },
            formDisabled: false,
        }
    },
    computed: {

    },
    methods: {
        play(e) {
            e.preventDefault();
            this.formDisabled = true;
            this.currentMessage.text = 'Проверка версии...'

            this.fetchConfig().then((data) => {
                var oldCfg = this.cfg;
                this.cfg = data;

                // TODO: strings dont work
                if (+oldCfg.client_version !== +this.cfg.client_version) { // download new version
                    this.currentMessage.text = 'Загрузка новой версии!'

                    let archivePath = path.join(this.gamePath, 'skymp.zip');
                    return this.downloadZip(this.cfg.client_url, archivePath).then(() => {
                        extract(archivePath, {dir: this.gamePath}, err => {
                            this.currentMessage.text = 'Распаковка архива...'

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
            this.currentMessage.text = 'Проверка конфигурации...'

            var data = {};
            return new Promise((resolve, reject) => {
                http.get("https://vk.com/page-120925453_53245312", res => {
                    res.setEncoding('utf8');
                    let rawData = '';
                    res.on('data', (chunk) => { rawData += chunk; });
                    res.on('end', () => {
                        data.client_url = getValueInDocument(rawData, 'targetURL')
                        data.client_version = getValueInDocument(rawData, 'targetVer')
                        data.server_ip = getValueInDocument(rawData, 'serverIP')
                        data.server_port = getValueInDocument(rawData, 'serverPort')
                        data.server_password = getValueInDocument(rawData, 'serverPassword')

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
          this.currentMessage.text = 'Запуск игры...'
          setTimeout(window.close, 5000);

          console.log('[startGame] Writing to ', skympFilenames.cfg)
          this.cfg.name = this.authData.login;
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
