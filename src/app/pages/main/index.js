import './style.styl';

import * as ini from 'app/utils/iniFile';

const fs = window.require('fs');
const path = window.require('path');

var pkg = require('app/../../package.json');
const cfgPath = path.resolve(__dirname, 'skymp_config.ini');

console.log('QQQ', pkg);
export default {
    template: require('./template.pug')(),
    data() {
        return {
            version: pkg.version,
            debugData: {
                dirname: __dirname,
            },
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
            console.log('PLaY', this.authData.login);
            this.cfg.name = this.authData.login;
            ini.write(cfgPath, this.cfg);
        },
    },
    created() {
        this.cfg = ini.read(cfgPath);
        if (this.cfg.name) this.authData.login = this.cfg.name;
        console.log('cfg', this.cfg);
    },
    mounted() {
        $('form#auth #login').focus();
    }
};
