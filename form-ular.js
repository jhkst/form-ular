function uc(url) {
    return (document.location.hash === '#uncache') ?  `${url}?${Date.now()}` : url;
}

function modalWarning(text, okCallback) {
    let warningModal = $('#warningModal');
    $('.modal-body', warningModal).text(text);
    let warningYes = $('#warning-yes', warningModal);
    warningYes.click(evt => {
        warningYes.off('click');
        okCallback(evt)
            .then(() => $('#warningModal').modal('hide'));
    });
    warningModal.modal('show');
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

$(window).on('load', function () {

});

$(document).ready(async function() {

    let formId = window.location.search.substr(1);

    let formSpec = await fetch(`forms/${formId}/form-spec.json`)
        .then(res => res.json())
        .catch(err => console.log(`Unknown form "${formId}"`, err));

    $('#title').text(`${formSpec["name-abbrev"]} - ${formSpec["name"]}`);
    document.title = `${formSpec["name-abbrev"]} - ${formSpec["name"]}`;

    onLoadModal(formSpec.warnings["disclaimer"], 'https://github.com/');

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

    $('#downloadPDF').click(evt => {
        let accept = (e) => {
            jsonDataObj.set('@form-background', false);
            return jsdPDF.createPdf(jsonDataObj).then(bytes => {
                saveAs(new Blob([bytes], {type: "application/pdf"}), "jsd-filled.pdf");
            });
        };
        doAction(accept, formSpec.warnings["downloadPDF"]);

    });
    $('#downloadPDFForm').click(evt => {
        let accept = (e) => {
            jsonDataObj.set('@form-background', true);
            return jsdPDF.createPdf(jsonDataObj).then(bytes => {
                saveAs(new Blob([bytes], { type: "application/pdf"}), "jsd-filled.pdf");
            });
        };
        doAction(accept, formSpec.warnings["downloadPDF"]);
    });
    $('#downloadJSON').click(evt => {
        let accept = (e) => {
            const str = jsonDataObj.stringify();
            const bytes = new TextEncoder().encode(str);
            const blob = new Blob([bytes], { type: "application/json;charset=utf-8" });

            saveAs(blob, uc("jsd-filled.json"));
            //todo: return promise
        };
        doAction(accept, formSpec.warnings["downloadJSON"]);

    });
    $('#downloadXML').click(evt => {
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
    $('#uploadJSON').click(evt => {
        let accept = (e) => {
            $('#upload-json-file').trigger('click');
            return Promise.resolve(null);
        };
        doAction(accept, formSpec.warnings["uploadJSON"]);
    });
    $('#upload-json-file').change(evt => {
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
    $('#uploadXML').click(evt => {
        let accept = (e) => {
            return Promise.resolve(null);
        };
        doAction(accept, formSpec.warnings["uploadXML"]);
    });

    $('#upload-xml-file').change(evt => {
        let fileReader = new FileReader();
        fileReader.onload = function () {
            let data = fileReader.result;
            fetch(data)
                .then(res => res.text())
                .then(text => (new window.DOMParser()).parseFromString(text, "text/xml"))
                .then(xml => console.log(xml));
        };
        fileReader.readAsDataURL($('#upload-xml-file').prop('files')[0]);
    });
    $('#cleanForm').click(evt => {
        let accept = (e) => {
            jsonDataObj.clean();
            return Promise.resolve(uiFormObj.fillForm(jsonDataObj));
        };
        doAction(accept, formSpec.warnings["cleanForm"]);
    });
    $('#startWizard').click(evt => {
        let accept = (e) => {
            return Promise.resolve(null);
        };
        doAction(accept, formSpec.warnings["startWizard"]);
    })


    let formPlace = $('#form-place');

    formPlace.append(await uiFormObj.createFormWithNav((id, val, origVal) => {
        jsonDataObj.set(id, val);
        jsonDataObj.localStore(localStoreKey);
        jsdSVG.updateText(id, jsonDataObj);
    }));

    jsonDataObj.localGet(localStoreKey);
    uiFormObj.fillForm(jsonDataObj);

});