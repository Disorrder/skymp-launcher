import './style.styl';

import * as ini from 'app/utils/iniFile';

const fs = window.require('fs');
const path = window.require('path');

var pkg = require('app/../../package.json');

export default {
    template: require('./template.pug')(),
    data() {
        return {
            version: pkg.version,
            versions: window.process.versions,
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
            console.log('PLaY', this.authData.login);
            this.cfg.name = this.authData.login;
            ini.write(cfgPath, this.cfg);
        },
    },
    created() {
        this.gamePath = localStorage.gamePath || '';
        if (!this.gamePath) this.$router.push({name: 'settings'});

        var cfgPath = path.resolve(this.gamePath, 'skymp_config.ini');
        this.cfg = ini.read(cfgPath);
        if (this.cfg.name) this.authData.login = this.cfg.name;
    },
    mounted() {
        $('form#auth #login').focus();
    }
};
