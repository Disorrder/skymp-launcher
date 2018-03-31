import './style.styl';

const {dialog} = window.require('electron').remote;

export default {
    template: require('./template.pug')(),
    data() {
        return {
            gamePath: '',
        }
    },
    computed: {

    },
    methods: {
        setGamePath() {
            var res = dialog.showOpenDialog({properties: ['openFile', 'openDirectory']});
            if (!res) return;
            this.gamePath = res[0];
            localStorage.gamePath = this.gamePath;
        },
        save() {
            this.$router.push({name: "main"});
        }
    },
    created() {
        this.gamePath = localStorage.gamePath;
    },
    mounted() {

    }
};
