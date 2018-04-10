import './style.styl';

const timePoint1 = (new Date).getTime();

import * as ini from 'app/utils/iniFile';
import * as miscUtil from 'app/utils/miscUtil';

var fs = window.require('fs');
var path = window.require('path');
var child_process = window.require('child_process');
var http = require('http');
var extract = window.require('extract-zip');
var copyFileSync = window.require('fs-copy-file-sync');
var requestPromise = undefined; // too fat to require on startup (over 300ms on my machine); I'l require it later

const timePoint2 = (new Date).getTime();
console.log('Loaded in: %d ms', timePoint2 - timePoint1);

const skympFilenames = {
    cfg: 'skymp_config.ini',
    starter: 'skymp.bat',
    zip: 'skymp.zip'
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
        async play(e) {
            e.preventDefault();
            this.formDisabled = true;

            if (!requestPromise) {
                requestPromise = window.require('request-promise');
                console.log("requestPromise was loaded");
            }

            const oldCfg = this.cfg;
            this.cfg = await this.fetchConfig();

            const isUpToDate = oldCfg.client_version && this.cfg.client_version && oldCfg.client_version.replace(/\s+/g, '') === this.cfg.client_version.replace(/\s+/g, '');
            if (isUpToDate) return this.startGame();

            this.currentMessage.text = 'Обновление до версии ' + this.cfg.client_version + ' ...';
            const archivePath = path.join(this.gamePath, skympFilenames.zip);
            await this.downloadZip(this.cfg.client_url, archivePath);

            extract(archivePath, {dir: this.gamePath}, err => {
                this.currentMessage.text = 'Установка...';
                console.log('files unzipped', err);
                if (!err) {
                    this.installMyGUIFont();
                    this.startGame();
                }
            });
        },

        async fetchConfig() {
            this.currentMessage.text = 'Проверка конфигурации...';
            const jsonString = await requestPromise('https://www.jasonbase.com/things/m5bX');
            const data = JSON.parse(jsonString);
            console.log('fetch cfg ', data);
            return data;
        },

        async downloadZip(url, filename) {
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

        installMyGUIFont() {
            /* 'extract-zip' can't extract a part of zip archive =>
                unzip of 'futuralightc1.otf' causes system error in some cases =>
                I'l pack that file with another name, unzip all files and then try to copy 'futuralightc1.otf__' to 'futuralightc1.otf'
                (It is acceptable behavior to fail 'copyFileSync' operation because the file is never updating)
            */
            try {
                const from = path.join(this.gamePath, 'MyGUI', 'futuralightc1.otf__');
                const to = path.join(this.gamePath, 'MyGUI', 'futuralightc1.otf');
                copyFileSync(from, to);
            } catch(err) {
                console.log('blocked by TESV.exe (it\'s OK)');
            }
        },

        startGame() {
            this.currentMessage.text = 'Запуск игры...';
            //setTimeout(window.close, 5000);

            // Save config
            console.log('Writing to ', skympFilenames.cfg);
            this.cfg.name = this.authData.login;
            const cfgPath = path.resolve(this.gamePath, skympFilenames.cfg);
            ini.write(cfgPath, this.cfg);

            // Save starter
            const batPath = path.join(this.gamePath, skympFilenames.starter);
            const batStr = 'cd ' + this.gamePath + ' && ' + 'skse_loader.exe';
            console.log('Writing to ', skympFilenames.starter);
            fs.writeFileSync(batPath, batStr);

            // Run starter
            console.log('child_process.spawnSync(...)');
            const p = child_process.spawn(batPath, []);

            p.stdout.on('data', data => {
                console.log(skympFilenames.starter, ' stdout: ', data);
            });
            p.stderr.on('data', async data => {
                console.log(skympFilenames.starter, ' stderr: ', data);
                this.currentMessage.text = 'Не удалось запустить Skyrim. Ищем другой способ...';
                await miscUtil.sleep(2333);
                this.currentMessage.text = 'Запуск игры...';

                // TODO: Start game
            });

        },
    },

    created() {
        this.gamePath = localStorage.gamePath || '';
        if (!this.gamePath) this.$router.push({name: 'settings'});

        // Load config
        const cfgPath = path.resolve(this.gamePath, skympFilenames.cfg);
        this.cfg = ini.read(cfgPath);
        if (this.cfg.name) this.authData.login = this.cfg.name;
    },

    mounted() {
        $('form#auth #login').focus();
    }
};
