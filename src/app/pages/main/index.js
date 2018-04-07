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

            console.log('[Play] The Button was pressed. Nickname is ', this.authData.login, '.');

            http.get("https://vk.com/page-120925453_53245312", res => {
              res.setEncoding('utf8');
              res.on('data', chunk => {

                var getValueInDocument = function(chunk, varName) {
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

                const clientUrl = getValueInDocument(chunk, 'targetURL')
                const clientVersion = getValueInDocument(chunk, 'targetVer')
                const serverIP = getValueInDocument(chunk, 'serverIP')
                const serverPort = getValueInDocument(chunk, 'serverPort')
                const serverPassword = getValueInDocument(chunk, 'serverPassword')

                var startGame = () => {
                  console.log('[startGame] Writing to ', skympFilenames.cfg)
                  this.cfg.name = this.authData.login;
                  this.cfg.server_ip = serverIP
                  this.cfg.server_port = serverPort
                  this.cfg.client_version = clientVersion
                  this.cfg.server_password = serverPassword
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

                if (this.cfg.client_version != clientVersion) { // download new version
                  const archivePath = path.join(this.gamePath, 'skymp.zip');
                  console.log('archivePath is ', archivePath)
                  var file = fs.createWriteStream(archivePath);
                  var request = http.get(clientUrl, res => {
                    res.pipe(file);
                  });
                  request.on('response', res => {
                    setTimeout(() => {
                      console.log('response: ', res);
                      extract(archivePath, {dir: this.gamePath}, err => {
                        console.log('files unzipped');
                        console.log(err);
                        startGame();
                        window.close();
                      });
                    }, 1000);
                  });
                } else {
                  console.log('[play] Client is up-to-date; calling startGame()')
                  startGame();
                  window.close();
                }
              });
            });
        },
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
