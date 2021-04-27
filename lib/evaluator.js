class Evaluator {

    constructor(locale = 'cs-CZ') {
        this.locale = locale;
    }

    /**
     * Replaces all expressions in template with appropriate evaluated value
     */
    templateValue(jsonData, template) {
        let resolvedVals = this.valueExpressions(template)
            .map(key => { return {'key': key, 'value': this.evaluate(key, jsonData)}; });

        let result = template;
        for(let res of resolvedVals) {
            let val = res.value;
            if(Evaluator._isNumber(val) && !Evaluator._isString(val)) {
                val = val.toLocaleString(this.locale);
            }
            result = result.replaceAll('{{' + res.key + '}}', val);
        }
        // console.log(`${template} => ${result}`);
        return result;
    }

    /**
     * Fetch all expressions '{{...}}' within template and returns array excluding curly brackets
     */
    valueExpressions(template) {
        return [...template.matchAll(/{{([^}]*)}}/g)].map(item => item[1])
    }

    /**
     * Evaluates expression on top of jsonData
     */
    evaluate(expression, jsonData) {
        let ast = null;
        try {
            ast = jsep(expression);
        } catch (e) {
            console.error(`Cannot parse "${expression}"`, e);
            return '';
        }

        let trav = new AstTraverse(
            AstTraverse.defaultEvalFunc(jsonData, this.methodCaller.bind(this))
        );
        let result = trav.evaluate(ast);
        return result == null ? '' : result;
    }

    methodCaller(callee, method, args) {
        if(callee != null) {
            switch (method) {
                case 'toFixed': return this.m_toFixed(callee, args[0], args[1] ? args[1]: null)
                case 'isBlank': return this.m_isBlank(callee);
                case 'asDate': return this.m_asDate(callee);
                default: throw 'Unknown method ' + method;
            }
        } else {
            switch (method) {
                case 'surround': return this.f_surround(args[0], args[1], args[2], args[3]);
                case 'ifSet': return this.f_ifSet(args[0], args[1], args[2]);
                case 'bool': return this.f_bool(args[0], args[1], args[2], args[3]);
                case 'ifAnySet': return this.f_ifAnySet(args[0], args[1], args[2]);
                case 'toFixed': return '';
                case 'isBlank': return true;
                default:
                    console.debug(`Ignoring call of "${method}" on undefined variable`);
            }
            return null;
        }
    }


    /**
     * Lists all keys present in template
     */
    affectedKeys(template) {
        let flatVar = (obj) => obj.var ? [obj.var] : obj;

        let trav = new AstTraverse({
            'CallExpression': (callee, method, args) => [...flatVar(callee == null ? [] : callee), ...[].concat.apply([], args).map(flatVar)],
            'MemberExpression': (obj, prop) => {
                if(typeof obj === 'object') {
                    obj.var = obj.var + '[' + prop + ']';
                    return obj;
                } else {
                    return obj + '[' + prop + ']'
                }
            },
            'BinaryExpression': (op, left, right) => [...flatVar(left), ...flatVar(right)],
            'ConditionalExpression': (test, consq, altr) => [...flatVar(test), ...flatVar(consq), ...flatVar(altr)],
            'LogicalExpression': (op, left, right) => [...flatVar(left), ...flatVar(right)],
            'ArrayExpression': (elems) => [].concat.apply([], elems).map(flatVar),
            'Literal': (val, isProperty) => isProperty ? val : [],
            'Identifier': (name, isRoot) => isRoot ? {var: name} : name,
            'UnaryExpression': (op, arg) => [...flatVar(arg)]
        })


        let res = this.valueExpressions(template)
            .map(expr => {
                let ast = null;
                try {
                    ast = jsep(expr);
                } catch (e) {
                    console.error(`Cannot parse "${expr}"`, e);
                    throw e;
                }
                let ev = trav.evaluate(ast);
                return flatVar(ev);
            })
            .flat();
        return [...new Set(res)]; // uniqueness construct
    }

    /**
     * Get value from {@code jsonData} by specifying simple path (dots and square brackets)
     * square brackets are used between dots. e.g.  hello.[3].world
     */
    static pathValue(pathDotStr, jsonData) {
        let pathArr = pathDotStr.split('.');
        return pathArr.reduce((acc, curr) => {
            let m = curr.match(/^\[([0-9]*)]$/);
            if(m) {
                curr = parseInt(m[1]);
            }
            return acc[curr];
        }, jsonData);
    }

    static _isNumber(val) {
        return !isNaN(val);
    }

    static _isString(val) {
        return typeof val === 'string' || val instanceof String;
    }

    m_asDate(val) {
        if(val == null) {
            return '';
        }
        if (!val.toDate) {
            return '';
        }
        return val.toDate().toLocaleString(this.locale);
    }

    m_toFixed(val, minDigits, maxDigits) {
        if(!maxDigits) {
            return val.toLocaleString(this.locale, {minimumFractionDigits: minDigits, maximumFractionDigits: minDigits});
        } else {
            return val.toLocaleString(this.locale, {minimumFractionDigits: minDigits, maximumFractionDigits: maxDigits});
        }
    }

    m_isBlank(val) {
        return (!val || /^\s*$/.test(val));
    }

    f_surround(prefix, val, suffix, otherwise) {
        if(val != null && !this.m_isBlank(val)) {
            return prefix + val + suffix;
        } else {
            return otherwise;
        }
    }

    f_ifSet(val, result, otherwise) {
        if(!this.m_isBlank(val)) {
            return result;
        }
        return otherwise;
    }

    f_bool(val, ifTrue, ifFalse, ifNotSet) {
        if(val == null || val === '') {
            return ifNotSet;
        }
        return val ? ifTrue : ifFalse;
    }

    f_ifAnySet(obj, value, otherwise) {
        return this._isAnySet(obj) ? value : otherwise;
    }

    _isAnySet(obj) {
        if(obj == null) {
            return false;
        } if(Array.isArray(obj)) {
            return obj.some(x => this._isAnySet(x));
        } else if(typeof obj === 'object') {
            return Object.values(obj).some(x => this._isAnySet(x));
        } else {
            return ! this.m_isBlank(obj);
        }
    }

}