const d_warningModal = $('#warningModal');
const btn_downloadPdf = $('#downloadPDF');
const btn_downloadPdfForm = $('#downloadPDFForm');
const btn_downloadJSON = $('#downloadJSON');
const btn_downloadXML = $('#downloadXML');
const btn_uploadJSON = $('#uploadJSON');
const upload_JSON = $('#upload-json-file');
const btn_uploadXML = $('#uploadXML');
const upload_XML = $('#upload-xml-file');
const btn_cleanForm = $('#cleanForm');
const btn_startForm = $('#startWizard');
const form_root = $('#form-place');

// hack for browsers not supporting replaceAll
if(typeof String.prototype.replaceAll !== "function") {
    String.prototype.replaceAll = function (substr, newSubstr) {
        return this.split(substr).join(newSubstr);
    };
}

function uc(url) {
    return (document.location.hash === '#uncache') ?  `${url}?${Date.now()}` : url;
}

function isBot() {
    return /bot|googlebot|crawler|spider|robot|crawling/i.test(navigator.userAgent);
}

function modalWarning(text, okCallback) {
    $('.modal-body', d_warningModal).text(text);
    let warningYes = $('#warning-yes', d_warningModal);
    warningYes.click(evt => {
        warningYes.off('click');
        okCallback(evt)
            .then(() => $('#warningModal').modal('hide'));
    });
    d_warningModal.modal('show');
}

function doAction(acceptCallback, modalMsg = null) {
    if(modalMsg != null) {
        modalWarning(modalMsg, acceptCallback);
    } else {
        acceptCallback();
    }
}

function onLoadModal(text, redirectUrl) {
    let onloadModal = $('#onloadModal').modal({backdrop: 'static', keyboard: false});
    $('.modal-body', onloadModal).text(text);
    let onloadNo = $('#onload-no', onloadModal);
    onloadNo.click(evt => {
        onloadNo.off('click');
        document.location.href = redirectUrl;
    });
    onloadModal.modal('show');
}

$(document).ready(async function() {

    let formId = window.location.search.substr(1);

    let formSpec = await fetch(`forms/${formId}/form-spec.json`)
        .then(res => res.json())
        .catch(err => console.log(`Unknown form "${formId}"`, err));

    $('#title-abbrev').text(formSpec["name-abbrev"]);
    $('#title-full').text(`${formSpec["name-abbrev"]} - ${formSpec["name"]}`);
    document.title = `${formSpec["name-abbrev"]} - ${formSpec["name"]}`;
    $('head').append($('<meta>', {'name': 'keywords', 'content': formSpec['keywords'].join(',')}));
    $('head').append($('<meta>', {'name': 'description', 'content': formSpec['description']}));

    if(!isBot()) {
        onLoadModal(formSpec.warnings["disclaimer"], 'https://github.com/');
    }

    if(!formSpec) {
        alert(`Formulář "${formId}" nenalezen!`);
        window.history.back();
    }

    let localStoreKey = formSpec["id"];
    let jsonSchemaObj = await new JsonSchema().loadFile(formSpec["data-schema"]);
    let jsonDataObj = new JsonData({}, jsonSchemaObj); // place where data are stored
    let paperSchemaJson = await fetch(uc(formSpec["paper-schema"])).then(res => res.json());

    let uiFormObj = new FuUiform(await fetch(uc(formSpec["ui-form"])).then(res => res.json()), jsonSchemaObj);
    let pdfFonts = await Promise.all(
        formSpec["fonts"].map(async fontSpec => ({
            name: fontSpec.name,
            data: await fetch(fontSpec.url).then(res => res.arrayBuffer())
        }))
    );

    let pdfBackground = await fetch(formSpec["pdf-background"]).then((res) => res.arrayBuffer());

    let svgForm = await fetch(formSpec["svg-background"]).then(res => res.text());

    let preview = $('#preview');
    preview.html(svgForm);
    let svg = $('svg', preview).css({'width': '100%', 'height': '100%'});

    let evaluator = new Evaluator(formSpec["locale"]);

    FuSvg.attachFontsToHtmlHead(formSpec["fonts"]);

    let jsdSVG = new FuSvg(svg, paperSchemaJson, evaluator);
    jsdSVG.updateAll(jsonDataObj);

    let jsdPDF = new FuPdf(paperSchemaJson, evaluator, pdfBackground, pdfFonts);

    btn_downloadPdf.click(evt => {
        let accept = (e) => {
            jsonDataObj.set('@form-background', false);
            return jsdPDF.createPdf(jsonDataObj).then(bytes => {
                saveAs(new Blob([bytes], {type: "application/pdf"}), "jsd-filled.pdf");
            });
        };
        doAction(accept, formSpec.warnings["downloadPDF"]);

    });
    btn_downloadPdfForm.click(evt => {
        let accept = (e) => {
            jsonDataObj.set('@form-background', true);
            return jsdPDF.createPdf(jsonDataObj).then(bytes => {
                saveAs(new Blob([bytes], { type: "application/pdf"}), "jsd-filled.pdf");
            });
        };
        doAction(accept, formSpec.warnings["downloadPDF"]);
    });
    btn_downloadJSON.click(evt => {
        let accept = (e) => {
            const str = jsonDataObj.stringify();
            const bytes = new TextEncoder().encode(str);
            const blob = new Blob([bytes], { type: "application/json;charset=utf-8" });

            saveAs(blob, uc("jsd-filled.json"));
            //todo: return promise
        };
        doAction(accept, formSpec.warnings["downloadJSON"]);

    });
    btn_downloadXML.click(evt => {
        let accept = async (e) => {
            let jsonXml = jsonDataObj.toXml();
            let xsltProcessor = new XSLTProcessor();
            await fetch(uc('forms/jsd_14312/jsd_jsonXml2CZ415A.xslt'))
                .then(res => res.text())
                .then(txt => new DOMParser().parseFromString(txt, "text/xml"))
                .then(xslt => xsltProcessor.importStylesheet(xslt));

            let xml = xsltProcessor.transformToDocument(jsonXml);

            const serializer = new XMLSerializer();
            const xmlStr = serializer.serializeToString(xml);
            let blob = new Blob([xmlStr], {type: "text/xml"});

            saveAs(blob, `CZ415A-${Date.now()}.xml`);

            return Promise.resolve(null)
        };
        doAction(accept, formSpec.warnings["downloadXML"]);
    })
    btn_uploadJSON.click(evt => {
        let accept = (e) => {
            $('#upload-json-file').trigger('click');
            return Promise.resolve(null);
        };
        doAction(accept, formSpec.warnings["uploadJSON"]);
    });
    upload_JSON.change(evt => {
        let fileReader = new FileReader();
        fileReader.onload = (evt) => {
            let data = fileReader.result;
            fetch(data)
                .then(res => res.text())
                .then(text => jsonDataObj.parse(text, jsonSchemaObj))
                .then(_ => jsonDataObj.localStore(localStoreKey))
                .then(_ => uiFormObj.fillForm(jsonDataObj));
        };
        fileReader.readAsDataURL($('#upload-json-file').prop('files')[0]);

    });
    btn_uploadXML.click(evt => {
        let accept = (e) => {
            $('#upload-xml-file').trigger('click');
            return Promise.resolve(null);
        };
        doAction(accept, formSpec.warnings["uploadXML"]);
    });

    upload_XML.change(evt => {
        let fileReader = new FileReader();
        fileReader.onload = async function () {
            let data = fileReader.result;
            let xml = await fetch(data)
                .then(res => res.text())
                .then(text => (new window.DOMParser()).parseFromString(text, "text/xml"));
            let xsltProcessor = new XSLTProcessor();
            await fetch(uc('forms/jsd_14312/jsd_CZ415A2Json.xslt'))
                .then(res => res.text())
                .then(txt => new DOMParser().parseFromString(txt, "text/xml"))
                .then(xslt => xsltProcessor.importStylesheet(xslt));

            let pad = (number) => (number < 10) ? `0${number}` : number;
            let tzo = new Date().getTimezoneOffset();
            let timeZone = (tzo >= 0 ? '-' : '+') + pad(Math.abs(tzo) / 60) + ':' + pad(Math.abs(tzo) % 60);

            xsltProcessor.setParameter(null, "timezone", timeZone); //FixMe: TimeZone should be set according to date in xml (e.g. daylight saving tz is different for different dates and not the same as today)
            let jsonStrDoc = xsltProcessor.transformToDocument(xml);
            let jsonStr = jsonStrDoc.children[0].textContent;

            jsonDataObj.parse(jsonStr);
            jsonDataObj.localStore(localStoreKey);
            uiFormObj.fillForm(jsonDataObj);

        };
        fileReader.readAsDataURL($('#upload-xml-file').prop('files')[0]);


    });
    btn_cleanForm.click(evt => {
        let accept = (e) => {
            jsonDataObj.clean();
            return Promise.resolve(uiFormObj.fillForm(jsonDataObj));
        };
        doAction(accept, formSpec.warnings["cleanForm"]);
    });
    btn_startForm.click(evt => {
        let accept = (e) => {
            return Promise.resolve(null);
        };
        doAction(accept, formSpec.warnings["startWizard"]);
    })

    await uiFormObj.createFormAndNav($('#form'), $('#form-navigation'), (id, val, origVal) => {
        jsonDataObj.set(id, val);
        jsonDataObj.localStore(localStoreKey);
        uiFormObj.updateFilledNav(id, val);
        jsdSVG.updateText(id, jsonDataObj);
    });


    jsonDataObj.localGet(localStoreKey);
    uiFormObj.fillForm(jsonDataObj);

});
