class JsonSchema {
    constructor() {
        this._data = {}
        this._refs = {};
        this._file = { path: [], name: null };
    }

    async loadFile(jsonSchemaFile) {
        this._file = JsonSchema._parseFileName(jsonSchemaFile);
        this._data = await fetch(jsonSchemaFile).then(res => res.json());
        await this._fetchRefs(this._data);
        return this;
    }

    defOf(pathArray) {
        let def = pathArray.reduce((acc, curr) => {
            if(acc['$ref']) {
                acc = {...this._refs[acc['$ref']], ...acc};
            }

            if(!isNaN(curr)) {
                return acc['items'];
            } else {
                return acc['properties'][curr];
            }

        }, this._data);
        if(def == null) {
            throw `Path [${pathArray.join(',')}] not defined in schema`;

        }
        if(def['$ref']) {
            def = {...this._refs[def['$ref']], ...def};
        }
        return def;
    }

    // PRIVATE SECTION

    async _fetchRefs(schema) {
        if(schema['$ref'] && !this._refs[schema['$ref']]) {
            let refObj = JsonSchema._parseRef(schema['$ref']);
            let pathArray = JsonSchema._refPathToArray(refObj.refPath);
            if(refObj.file !== '') {
                let refFileName = JsonSchema._fixRelativePath(this._file, refObj.file);
                let refJson = await fetch(refFileName).then(res => res.json());
                this._refs[schema['$ref']] = pathArray.reduce((acc, curr) => acc[curr], refJson);
            } else {
                this._refs[schema['$ref']] = pathArray.reduce((acc, curr) => acc[curr], this._data);
            }
        }

        switch (schema['type']) {
            case 'object':
                for(let val of Object.values(schema['properties'])) {
                    await this._fetchRefs(val);
                }
                break;
            case 'array':
                await this._fetchRefs(schema['items']);
                break;
        }
    }

    static _parseRef(refSpec) {
        let hashPos = refSpec.indexOf('#');
        if(hashPos < 0) {
            throw `Wrong $ref specification ${refSpec}`;
        }
        return {
            file: refSpec.substring(0, hashPos).trim(),
            refPath: refSpec.substring(hashPos + 1).trim()
        };
    }

    static _refPathToArray(refPath) {
        let toArray = refPath.split('/');
        toArray.shift();
        return toArray;
    }

    static _parseFileName(filename) {
        let split = filename.split('/');
        let name = split.pop();
        return {
            name: name,
            path: split
        };
    }

    static _fixRelativePath(originFile, refFileName) {
        let refFile = JsonSchema._parseFileName(refFileName);
        let newPath = refFile.path.reduce((acc, curr) => {
            switch (curr) {
                case '.': break;
                case '..': acc.pop(); break;
                default: acc.push(curr);
            }
            return acc;
        }, originFile.path);

        return newPath.join('/') + '/' + refFile.name;
    }
}