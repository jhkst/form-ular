class FuSvg {
    constructor(svgElement, paperSchemaJson, evaluator) {
        this.svgNS = "http://www.w3.org/2000/svg";
        this.layerElement = document.createElementNS(this.svgNS, "g");
        this.layerElement.setAttributeNS(null, "id", "formData");
        $(svgElement).append(this.layerElement);
        this.paperSchema = paperSchemaJson;
        this.evaluator = evaluator;
        this.r = 1;
        this.loadPaperSchema(this.paperSchema);
        this.units = "";
    }

    loadPaperSchema(paperSchemaJson) {
        let fontFamily = paperSchemaJson.global["font-family"];
        let fontSize = paperSchemaJson.global["font-size"] ? paperSchemaJson.global["font-size"] : 10;
        this.units = paperSchemaJson.global["units"] ? paperSchemaJson.global["units"] : "";
        let lineHeight = paperSchemaJson.global["line-height"] ? paperSchemaJson.global["line-height"] : "1em";
        let textAnchor = paperSchemaJson.global["text-anchor"] ? paperSchemaJson.global["text-anchor"] : "start";

        paperSchemaJson.positioning.forEach((val, idx) => {
            if(val["type"] !== "text") return;
            let newText = document.createElementNS(this.svgNS, "text");
            newText.setAttributeNS(null, "x", (val["pos"].x * this.r) + this.units);
            newText.setAttributeNS(null, "y", (val["pos"].y * this.r) + this.units);
            newText.setAttributeNS(null, "font-size", FuSvg._fnt(val["font-size"] ? val["font-size"] : fontSize));
            newText.setAttributeNS(null, "font-family", val["font-family"] ? val["font-family"] : fontFamily)
            newText.setAttributeNS(null, "class", [...this.evaluator.affectedKeys(val["value"]), FuSvg._paperClass(idx)].join(' '));
            newText.setAttributeNS(null, "data-line-height", val["line-height"] ? val["line-height"] : lineHeight);
            newText.setAttributeNS(null, "text-anchor", val["text-anchor"] ? val["text-anchor"] : textAnchor);
            let textNode = document.createTextNode("");
            newText.appendChild(textNode);
            this.layerElement.append(newText);
        });
    }

    updateAll(jsonDataObj) {
        this.paperSchema.positioning.filter(x => x['type'] === 'text')
            .forEach((val, idx) => {
                this.updateText(FuSvg._paperClass(idx), jsonDataObj);
            });
    }

    updateText(cssClass, jsonDataObj) {
        let elements = this.layerElement.getElementsByClassName(cssClass);
        Array.from(elements).forEach((el, idx, arr) => {
            let schemaIdx = Array.from(el.classList).map(x => FuSvg._paperIdxFromClass(x)).find(idx => idx != null);

            let value = this.paperSchema.positioning[schemaIdx]["value"];

            el.innerHTML = '';
            let x = el.getAttribute('x');
            let y = el.getAttribute('y');
            let lineHeight = el.getAttribute('data-line-height');

            FuSvg._getLines(this.evaluator.templateValue(jsonDataObj.data(), value))
                .forEach((line, idx) => {
                    let tspan = document.createElementNS(this.svgNS, "tspan");
                    if(idx > 0) {
                        tspan.setAttributeNS(null, "x", x);
                        tspan.setAttributeNS(null, "dy", lineHeight);
                    }
                    tspan.textContent = line === '' ? '\u00A0' : line; // SVG ignores empty lines
                    el.appendChild(tspan);
                });
        })
    }

    static attachFontsToHtmlHead(fontList) {
        let fontFaceDef = (name, style, weight, url) => {
            let ext = url.split('.').pop(); // extension
            let type = {"woff": "woff", "woff2": "woff2", "ttf": "truetype", "otf": "opentype"};
            return `@font-face {
                font-family: '${name}';
                font-style: ${style};
                font-weight: ${weight};
                src: url("${url}") format('${type[ext]}');
            }`;
        };

        let allStyles = fontList.map(item => fontFaceDef(item.name, item.style, item.weight, item.url)).join('\n');

        $('html head').append(`<style>${allStyles}</style>`);
    }

    static _fnt(size) {
        return size/2.835;
    }

    static _getLines(value) {
        return value.split('\n');
    }

    static _paperClass(idx) {
        return `PAPER_${idx}`;
    }

    static _paperIdxFromClass(clazz) {
        if(clazz.startsWith('PAPER_')) {
            return parseInt(clazz.substring(6));
        }
        return null;
    }

}