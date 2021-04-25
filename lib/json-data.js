class JsonData {
    constructor(data = {}, schemaObj = null) {
        this._data = data;
        this._schemaObj = schemaObj;
    }

    data(val = null) {
        if(val != null) {
               this._data = val;
        }
        return this._data;
    }

    clean() {
        this._data = {};
    }

    get(path) {
        let pathArray = JsonData._tokenize(path);

        return pathArray.reduce((acc, curr) => {
            return acc != null && acc[curr] != null ? acc[curr] : undefined;
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

    parse(jsonText) {
        this._data = {}; // clean before loading
        this._data = JSON.parse(jsonText, (key, value) => {
            if(Object.prototype.toString.call(value) !== "[object String]") {
                return value;
            }
            let m = value.match(/^#([^:]*):(.*)/);
            if(!m || m.length < 3) {
                return value;
            }
            switch (m[1]) {
                case 'date': return FDate.parse(m[2]);
                case 'date-time': return FDateTime.parse(m[2]);
            }

            return value;
        });
    }

    stringify() {
        // JSON.stringify is calling toJSON before replacer is called so it causes passing pure string instead of Date
        // workaround: temporarily remove toJSON method before stringification
        let dateToJson = Date.prototype.toJSON;
        delete Date.prototype.toJSON;

        let res = JSON.stringify(this._data, ((key, value) => {
            if(FDate.isFDate(value)) {
                return `#date:${value.toString()}`;
            } else if(FDateTime.isFDateTime(value)) {
                return `#date-time:${value.toString()}`;
            }
            return value;
        }))
        ;
        Date.prototype.toJSON = dateToJson; // return original functionality of toJSON
        return res;
    }

    toXml() {
        let doc = document.implementation.createDocument("", "", null);
        let root = JsonData._toXml(doc, {ROOT: this._data})[0];
        doc.appendChild(root);
        return doc;
    }

    localStore(key) {
        localStorage.setItem(key, this.stringify());
    }

    localGet(key) {
        let store = localStorage.getItem(key);
        try {
            this.parse(store == null ? {} : store, this._schemaObj);
        } catch(e) {
            localStorage.removeItem(key);
            console.warn("Local storage contains inconsistent data. Cleared.", e);
        }
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
                let type = typeof value;
                if(FDate.isFDate(value)) {
                    type = 'date';
                    value = value.toString();
                } else if(FDateTime.isFDateTime(value)) {
                    type = 'datetime';
                    value = value.toString();
                }

                let e = doc.createElement(type);
                e.setAttribute('name', key);

                this._toXml(doc, value).forEach(x => e.appendChild(x));

                return e;
            });
        } else {
            return [doc.createTextNode(data.toString())];
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
