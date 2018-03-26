const fs = window.require('fs');
const os = window.require('os');

export function parse(str = '') {
    var val = {};
    console.log(str);
    str.split('\n').forEach((s) => {
        var [v, k] = s.split('=');
        val[v] = k;
    });
    return val;
}

export function stringify(val = {}) {
    return Object.keys(val).map((k) => k + '=' + val[k]).join(os.EOL);
}

export function read(filepath) { // readFromFile
    if (!fs.existsSync(filepath)) return {};
    let str = fs.readFileSync(filepath);
    str = str.toString();
    return parse(str);
}

export function write(filepath, val) { // writeToFile
    fs.writeFileSync(filepath, stringify(val));
}
