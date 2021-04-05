class JsonData {
    constructor(data = {}) {
        this._data = data;
    }

    data(val = null) {
        if(val == null) {
            return this._data;
        }
        this._data = val;
        return this._data;
    }

    clean() {
        this._data = {};
    }

    get(path) {
        let pathArray = JsonData._tokenize(path);

        return pathArray.reduce((acc, curr) => {
            return acc && acc[curr] ? acc[curr] : undefined;
        }, this._data);
    }

    set(path, value) {
        let pathArray = JsonData._tokenize(path);

        pathArray.reduce((acc, curr, idx, arr) => {
            if(idx === arr.length - 1) {
                acc[curr] = value;
            } else {
                if(typeof acc[curr] === 'undefined') {
                    acc[curr] = {};
                }
                return acc[curr];
            }
        }, this._data);

    }

    toXml() {
        let doc = document.implementation.createDocument("", "", null);
        let root = JsonData._toXml(doc, {ROOT: this._data})[0];
        doc.appendChild(root);
        console.log(root, doc);
        return doc;
    }

    localStore(key) {
        localStorage.setItem(key, JSON.stringify(this._data));
    }

    localGet(key) {
        let store = localStorage.getItem(key);
        try {
            this._data = store ? JSON.parse(store) : {};
        } catch(e) {
            localStorage.removeItem(key);
            console.warn("Local storage contains inconsistent data. Cleared.", e);
        }
    }

    static fromXml(xmlDoc) {
        console.log(xmlDoc);
    }


    static _toXml(doc, data) {
        if(Array.isArray(data)) {
            return data.map(value => {
                let e = doc.createElement('array');
                let ch = this._toXml(doc, value);
                ch.forEach(x => e.appendChild(x));
                return e;
            });
        } else if(typeof data == 'object') {
            return Object.entries(data).map(([key, value]) => {
                let e = doc.createElement('object');
                e.setAttribute('name', key);
                let ch = this._toXml(doc, value);
                ch.forEach(x => e.appendChild(x));
                return e;
            });
        } else {
            return [doc.createTextNode(data)];
        }
    }



    static _tokenize(path) {
        if(path === '') {
            return [];
        }
        let cnv = (x) => /^\d+$/.test(x) ? parseInt(x) : x; // convert array index to integer

        let m = path.match(/^\.?([^.[]+)(.*)$/) ||  //.xxx.yyy  => xxx, .yyy   OR   .xxx[yyy] => xxx, [yyy]
            path.match(/^\[([^\]]+)](.*)$/);          // [xxx][yyy] => xxx, [yyy]

        if(m) {
            return [cnv(m[1]), ...this._tokenize(m[2])];
        } else {
            throw 'Unknown match ' + path;
        }
    }


}
