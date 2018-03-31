import './style.styl';

import * as ini from 'app/utils/iniFile';

const fs = window.require('fs');
const path = window.require('path');
const child_process = window.require('child_process');

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
            debugData: {
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

            console.log('[Play] Writing to ', skympFilenames.cfg)
            this.cfg.name = this.authData.login;
            const cfgPath = path.resolve(this.gamePath, skympFilenames.cfg)
            ini.write(cfgPath, this.cfg);

            const batPath = this.gamePath + '/' + skympFilenames.starter;
            const batStr = 'cd %~dp0\nstart /b skse_loader.exe'
            console.log('[Play] Writing to ', skympFilenames.starter)
            fs.writeFileSync(batPath, batStr)

            console.log('[Play] child_process.spawnSync(...)')
            const p = child_process.spawnSync(batPath, []);

            window.close()
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
