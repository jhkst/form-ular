class AstTraverse {
    constructor(funcs = {}) {
        this.funcs = {
            ...{
                'CallExpression': (callee, args) => {},
                'MemberExpression': (obj, prop) => {},
                'BinaryExpression': (op, left, right) => {},
                'ConditionalExpression': (test, consq, altr) => {},
                'LogicalExpression': (op, left, right) => {},
                'ArrayExpression': (elems) => {},
                'Literal': (val, isProperty) => {},
                'Identifier': (name, isRoot) => {},
                'UnaryExpression': (op, arg) => {}
            },
            ...funcs
        };
    }

    static defaultEvalFunc(variablesJson, callMethodFunc = (callee, method, args) => {}) {
        let binExpr = (op, left, right) => {
            if(left == null || right == null) {
                console.warn(`Operand of "${op}" is null: "${left} ${op} ${right}"`);
                return null;
            }
            switch (op) {
                case '+': return left + right;
                case '-': return left - right;
                case '*': return left * right;
                case '/': return left / right;
                case '%': return left % right;

                default: throw `'${op}' operator not yet implemented`;
            }
        }

        let unaExpr = (op, arg) => {
            if(arg == nul) {
                console.warn(`Operand of "${op}" is null: "${op} ${arg}"`);
                return null;
            }
            switch (op) {
                case '!': return !arg;
                case '-': return -arg;
                case '+': return +arg;

                default: throw `'${op}' operator not yet implemented`;
            }
        }

        return  {
            'CallExpression': callMethodFunc,
            'MemberExpression': (obj, prop) => obj != null ? obj[prop] : null,
            'BinaryExpression': binExpr,
            'ConditionalExpression': (test, consq, altr) => (test ? consq : altr),
            'LogicalExpression': binExpr,
            'ArrayExpression': (elems) => elems,
            'Literal': (val, isPropery) => val,
            'Identifier': (name, isRoot) => (isRoot ? variablesJson[name] : name),
            'UnaryExpression': unaExpr
        };
    }

    evaluate(ast) {
        return this.traverse(ast, true, false);
    }
    
    traverse(ast, isCallee = false, isProperty = false) {
        let out = null;
        try {
            switch (ast['type']) {
                case 'CallExpression':
                    if (ast['callee']['type'] === 'Identifier') {
                        out = this.funcs.CallExpression(null, ast['callee']['name'], ast['arguments'].map(x => this.traverse(x)));
                    } else if(ast['callee']['type'] === 'MemberExpression') {
                        out = this.funcs.CallExpression(this.traverse(ast['callee']['object']), this.traverse(ast['callee']['property']), ast['arguments'].map(x => this.traverse(x)));
                    } else {
                        throw 'Unknown call type: ' + ast['callee']['type'];
                    }
                    break;
                case 'MemberExpression': out = this.funcs.MemberExpression(this.traverse(ast['object'], true), this.traverse(ast['property'], false, true)); break;
                case 'BinaryExpression': out = this.funcs.BinaryExpression(ast['operator'], this.traverse(ast['left']), this.traverse(ast['right'])); break;
                case 'ConditionalExpression': out = this.funcs.ConditionalExpression(this.traverse(ast['test']), this.traverse(ast['consequent']), this.traverse(ast['alternate'])); break;
                case 'LogicalExpression': out = this.funcs.LogicalExpression(ast['operator'], this.traverse(ast['left']), this.traverse(ast['right'])); break;
                case 'ArrayExpression': out = this.funcs.ArrayExpression(ast['elements'].map(el => this.traverse(el))); break;
                case 'Literal': out = this.funcs.Literal(ast['value'], isProperty); break;
                case 'Identifier': out = this.funcs.Identifier(ast['name'], isCallee); break;
                case 'UnaryExpression': out = this.funcs.UnaryExpression(ast['operator'], this.traverse(ast['argument'])); break;
                case 'ThisExpression': throw 'ThisExpression not supported';
                case 'Compound': throw 'Compound not supported';
            }
            return out;
        } catch (e) {
            console.error("Traverse error", ast, isCallee, isProperty, e);
            throw e;
        }
    }



}