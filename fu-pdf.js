class FuPdf {

    constructor(paperSchemaJson, evaluator, backgroundPdfArrayBuffer = null, fontArrayBuffers = []) {
        this.paperSchema = paperSchemaJson;
        this.mmx = 1;
        this.mmy = 1;
        this.evaluator = evaluator;
        this.backgroundPdfArrayBuffer = backgroundPdfArrayBuffer;
        this.fontArrayBuffers = fontArrayBuffers;
        this.fonts = {};
    }

    async createPdf(jsonDataObj) {
        let pdfDoc = null;
        let page = null;

        if (jsonDataObj.get('@form-background')) {
            pdfDoc = await PDFLib.PDFDocument.load(this.backgroundPdfArrayBuffer);
            page = pdfDoc.getPages()[0];
        } else {
            pdfDoc = await PDFLib.PDFDocument.create();
            page = pdfDoc.addPage(PDFLib.PageSizes.A4);
        }

        await pdfDoc.registerFontkit(fontkit);

        let font = null;
        for(let f of this.fontArrayBuffers) {
            this.fonts[f.name] =  await pdfDoc.embedFont(f.data);
        }

        this.mmx = page.getWidth() / 210;
        this.mmy = page.getHeight() / 297;

        this._fillTexts(page, font, jsonDataObj);

        return await pdfDoc.save();
    }



    static _mm2pt(size) {
        return size * 2.835;
    }

    _fillTexts(page, font, jsonDataObj) {
        this.paperSchema.positioning.forEach(item => {
            if(item['type'] !== 'text') return;
            let x = item.pos.x;
            let y = item.pos.y;
            let value = item.value;
            let fontFace = this._pickAttr(item, 'font-face', 'Liberation Sans')
            let fontSize = this._pickAttr(item, 'font-size', 10);
            let lineHeight = this._pickAttr(item, 'line-height', '1em');
            let textAnchor = this._pickAttr(item, 'text-anchor', 'start');

            let fontSizePt = FuPdf._mm2pt(fontSize);
            let lineHeightEm = parseInt(lineHeight.replace(/em$/, ''));
            let lineHeightPx = lineHeightEm * this.fonts[fontFace].heightAtSize(fontSize)

            let text = this.evaluator.templateValue(jsonDataObj.data(), value);

            let textLines = text.split('\n');

            textLines.forEach((line, idx) => this._drawLine(page, x, y, line, idx, lineHeightPx, fontFace, fontSize, textAnchor));

        })
    }

    _drawLine(page, x, y, text, lineIndex, lineHeight, fontFace, fontSize, textAnchor) {
        let textWidth = this.fonts[fontFace].widthOfTextAtSize(text, fontSize);
        let anchorShiftX = {'start': 0, 'middle': textWidth / 2, 'end': textWidth }[textAnchor] || 0;

        page.drawText(text, {
            x: x * this.mmx - anchorShiftX,
            y: page.getHeight() - y * this.mmy - lineHeight * lineIndex,
            size: fontSize,
            font: this.fonts[fontFace]
        });
    }

    _pickAttr(item, name, defaultValue) {
        return [item[name], this.paperSchema.global[name], defaultValue].find(x => x);
    }
}