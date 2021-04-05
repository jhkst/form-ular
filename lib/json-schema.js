class JsonSchema {
    constructor() {
        this._data = {}
        this.refs = {};
    }

    async loadFile(jsonSchemaFile) {
        this._data = await fetch(jsonSchemaFile).then(res => res.json());
        await this._fetchRefs(this._data);
        return this;
    }

    defOf(pathArray) {
        let def = pathArray.reduce((acc, curr) => {
            if(acc['$ref']) {
                acc = {...this.refs[acc['$ref']], ...acc};
            }

            if(!isNaN(curr)) {
                return acc['items'];
            } else {
                return acc['properties'][curr];
            }

        }, this._data);
        if(def['$ref']) {
            def = {...this.refs[def['$ref']], ...def};
        }
        return def;
    }

    // PRIVATE SECTION

    async _fetchRefs(schema) {
        if(schema['$ref'] && !this.refs[schema['$ref']]) {
            let refObj = JsonSchema._parseRef(schema['$ref']);
            let pathArray = JsonSchema._refPathToArray(refObj.refPath);
            if(refObj.file !== '') {
                let refJson = await fetch(refObj.file).then(res => res.json());
                this.refs[schema['$ref']] = pathArray.reduce((acc, curr) => acc[curr], refJson);
            } else {
                this.refs[schema['$ref']] = pathArray.reduce((acc, curr) => acc[curr], this._data);
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
}