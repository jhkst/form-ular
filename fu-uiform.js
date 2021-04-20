class FuUiform {
    constructor(uiForm, jsonSchema) {
        this.uiForm = uiForm;
        this.jsonSchema = jsonSchema;
        this.form = null;
    }

    async createFormAndNav(formEl, navEl, changeCallback) {
        $(navEl).append(this._createNav(formEl));
        this.form = await this._createForm(formEl);
        $(formEl).append(this.form);

        FuUiform._addSelect2(this.form);
        FuUiform._setChangeCallback(this.form, changeCallback);
    }

    async _createForm(parentEl) {
        let form = $('<form class="form-core">');

        for (let pageItem of this.uiForm['pages']) {
            let card = $('<div class="form-card">').addClass('anchor-point').attr('id', FuUiform._navAnchor(pageItem));
            let title = $('<legend>').addClass('fs-title').text(`${pageItem.nav.title}. ${pageItem.title}`);
            card.append(title);
            for (let itemRec of pageItem.items) {
                let group = $('<div class="form-group">');
                let formItem = (typeof itemRec === 'object') ? itemRec : {"id": itemRec};
                let schemaItem = this.getSchemaItem(formItem.id);

                let type = schemaItem['type'];
                let helpId = `help-modal-${formItem.id}`;
                let helpIcon = $('<i>').addClass(['button-icon', 'icon-help'])
                    .attr('role', 'button')
                    .attr('data-toggle', 'modal')
                    .attr('data-target', `#${helpId}`);
                helpIcon.click((evt) => {
                    $(document.getElementById(helpId)).modal({
                        show: true,
                        closeOnEscape: true
                    });
                });

                let label = $('<label>').attr('for', formItem.id);
                let labelSpan = $('<span>').addClass('form-label-text').text(schemaItem['title']);
                label.append(helpIcon);
                label.append(labelSpan)
                let formInput = this._createFormInputForSchema(schemaItem, formItem);

                let documentation = FuUiform._createHelpModal(helpId, schemaItem['title'], schemaItem['description']);

                group.append(label);
                group.append(formInput);
                $('body').append(documentation); //putting modal in the root

                card.append(group);

            }

            form.append(card);
        }

        parentEl.scroll(() => {
            let onAnchor = Array.from($('.anchor-point'))
                .find(item => $(item).position().top >= 0);
            let formNavAnchor = $('.form-nav-anchor');
            let formNavHighlightClass = "form-nav-highlight";

            formNavAnchor.removeClass(formNavHighlightClass);
            let onId = $(onAnchor).attr('id');

            let toHighlight = Array.from(formNavAnchor).find((item) => $(item).data('href') === onId);
            $(toHighlight).addClass(formNavHighlightClass);

        });

            // console.log(text(), $('.anchor-point').position().top);
        return form;
    }

    static _createHelpModal(helpId, title, text) {
        let modal = $('<div>').addClass(['modal', 'modal-bottom', 'fade'])
            .attr('id', helpId)
            .attr('tabindex', '-1').attr('role', 'dialog').attr('aria-labelledby', helpId);
        let modalDialog = $('<div>').addClass('modal-dialog').attr('role', 'document');
        let modalContent = $('<div>').addClass('modal-content');
        let modalHeader = $('<div>').addClass('modal-header');
        let modalTitle = $('<h5>').addClass('modal-title').text(title);
        let closeButton = $('<div>').attr('type', 'button').addClass('close').attr('data-dismiss', 'modal').attr('aria-label', 'Close');
        let closeButtonSpan = $('<span>').attr('aria-hidden', 'true').text('×');
        let modalBody = $('<div>').addClass(['modal-body', 'help-text']).text(text);
        modal.append(modalDialog);
        modalDialog.append(modalContent);
        modalContent.append(modalHeader);
        modalContent.append(modalBody);
        modalHeader.append(modalTitle);
        modalHeader.append(closeButton);
        closeButton.append(closeButtonSpan);
        return modal;
    }

    fillForm(jsonDataObj) {
        $.each($(':input', this.form), (idx, el) => {
            let $el = $(el);
            let id = $el.attr('id');
            let val = jsonDataObj.get(id);

            if ($el.attr('type') === 'date') {
                val = val ? FuUiform._formatDate(val) : '';
            } else if ($el.attr('type') === 'datetime-local') {
                val = val ? FuUiform._formatDateTime(val) : '';
            } else if (typeof val === 'boolean') {
                val = val.toString();
            }
            this.updateFilledNav(id, val);
            $el.val(val).trigger('change');
        });
    }

    updateFilledNav(id, val) {
        let isFilled = (v) => (v != null && v !== '');

        //get changed page
        let formCard = $(document.getElementById(id), this.form).parents('.form-card').first();
        let page = formCard.parent().children().index(formCard);

        //if all are filled, mark it
        let notFilledCount = $(':input', formCard).filter(function () { return !isFilled($(this).val()) }).length;


        let nav = $('.form-nav li.form-nav-anchor').eq(page);
        if(notFilledCount === 0) {
            nav.addClass('form-nav-filled');
        } else {
            nav.removeClass('form-nav-filled');
        }
    }

    static _addSelect2(form) {
        $.each($('select', form), (idx, el) => {
            el = $(el);
            let select2opt = {
                width: '100%'
            };
            if(el.hasClass('select-no-search')) {
                select2opt.minimumResultsForSearch = Infinity;
            }
            el.select2(select2opt);
        });
    }

    static _setChangeCallback(form, callback) {
        $(':input', form).on('keyup change paste', function (evt) {
            let origVal = $(this).val();
            let val = origVal;
            let type = $(this).data('type');

            switch (type) {
                case 'integer':
                    val = (val === '') ? '' : parseInt(val);
                    break;
                case 'boolean':
                    val = (val === '') ? '' : (val === 'true');
                    break;
                case 'number':
                    val = (val === '') ? '' : parseFloat(val);
                    break;
                case 'date':
                    val = (val === '') ? '' : new Date(val + 'T00:00');
                    break;
                case 'datetime':
                    val = (val ==='') ? '' : new Date(val);
                    break;
            }

            callback($(this).attr('id'), val, origVal);
        });
    }

    static _formatDate(date) {
        if(!FuUiform._dateValid(date)) {
            return '';
        }
        return `${date.getFullYear()}-${this._pad0(date.getMonth() + 1)}-${date.getDate()}`;
    }

    static _formatDateTime(dt) {
        if(!FuUiform._dateValid(dt)) {
            return '';
        }
        return `${dt.getFullYear()}-${this._pad0(dt.getMonth() + 1)}-${this._pad0(dt.getDate())}T${this._pad0(dt.getHours())}:${this._pad0(dt.getMinutes())}:${this._pad0(dt.getSeconds())}.${this._pad0(dt.getMilliseconds(), 3)}`;
    }

    static _dateValid(date) {
        // If the date object is invalid it
        // will return 'NaN' on getTime()
        // and NaN is never equal to itself.
        return date != null && date.getTime() === date.getTime();
    }

    static _pad0(num, digits = 2) {
        return num.toString().padStart(digits, '0');
    }

    _createNav(scrollableEl) {
        let root = $('<ul class="nav flex-column form-nav">');
        for (let pageItem of this.uiForm['pages']) {
            let title = pageItem['nav']['title'];
            let tooltip = pageItem['title'];
            let li = $('<li class="nav-item form-nav-anchor">')
                .attr('role', 'button')
                .data('href', FuUiform._navAnchor(pageItem))
                .attr('title', tooltip)
                .text(title);

            li.click(evt => {
                // console.log('Anchoring to ', $(`#${FuUiform._navAnchor(pageItem)}`).offset());
                // console.log('scrollTop', $('.form-scrollable-area').scrollTop());
                // console.log('offset.top', $(`#${FuUiform._navAnchor(pageItem)}`).offset().top);
                // console.log('position.top', $(`#${FuUiform._navAnchor(pageItem)}`).position().top);

                let scrollableArea = $(scrollableEl);

                scrollableArea.scrollTop(
                    scrollableArea.scrollTop()
                    + $(`#${FuUiform._navAnchor(pageItem)}`).position().top
                    - 49   // magic number adjusted manually
                );

            });

            root.append(li);
        }
        return $('<div class="col-md-1">').append(root);
    }

    static _navAnchor(pageItem) {
        return `FORM_NAV_${pageItem['nav']['title']}`
    }

    getSchemaItem(id) {
        let pathArr = id.replace(/]$/, "").replace('[', '][').split('][')
            .map(x => isNaN(x) ? x : parseInt(x));

        return this.jsonSchema.defOf(pathArr);
    }

    _createFormInputForSchema(schemaItem, formItem) {
        let resElem;
        switch (schemaItem.type) {
            case 'string':
                if (formItem.type === 'textarea') {
                    let textarea = $('<textarea>').addClass('form-control');
                    FuUiform._condAttr(textarea, 'minlength', schemaItem.minLength);
                    FuUiform._condAttr(textarea, 'maxlength', schemaItem.maxLength);
                    FuUiform._condAttr(textarea, 'pattern', schemaItem.pattern);
                    FuUiform._condAttr(textarea, 'rows', schemaItem.rows, 1);
                    resElem = textarea;
                } else if (schemaItem['format'] === 'date') {
                    let input = $('<input>').addClass('form-control').attr('type', 'date').data('type', 'date')
                        .attr('placeholder', 'yyyy-MM-dd');
                    FuUiform._condAttr(input, 'pattern', schemaItem.pattern);
                    resElem = input;
                } else if (schemaItem['format'] === 'date-time') {
                    let input = $('<input>').addClass('form-control').attr('type', 'datetime-local').data('type', 'datetime')
                        .attr('placeholder', 'yyyy-MM-dd𝐓HH:mm[:ss.fff]');
                    FuUiform._condAttr(input, 'pattern', schemaItem.pattern);
                    resElem = input;
                } else if (schemaItem['enum']) {
                    let select = $('<select>').addClass('form-control');
                    FuUiform._addEmptyOption(select);
                    schemaItem['enum'].forEach(opt => {
                        select.append($('<option>').attr('value', opt).text(opt));
                    })
                    resElem = select;
                } else if (schemaItem['docHint'] === 'enum') {
                    let select = $('<select>').addClass('form-control');
                    FuUiform._addEmptyOption(select);
                    schemaItem['anyOf'].forEach(optSpec => {
                        select.append($('<option>').attr('value', optSpec.const).text(`${optSpec.const} - ${optSpec.description}`));
                    })
                    resElem = select;
                } else {
                    let input = $('<input>').addClass('form-control').attr('type', 'text');
                    FuUiform._condAttr(input, 'minlength', schemaItem.minLength);
                    FuUiform._condAttr(input, 'maxlength', schemaItem.maxLength);
                    FuUiform._condAttr(input, 'pattern', schemaItem.pattern);
                    resElem = input;
                }
                break;
            case 'integer':
                if (schemaItem['anyOf']) {
                    let select = $('<select>')
                        .addClass('select-no-search')
                        .addClass('form-control');
                    FuUiform._addEmptyOption(select);
                    schemaItem['anyOf'].forEach(optSpec => {
                        select.append($('<option>').attr('value', optSpec['const']).text(optSpec['description']));
                    });
                    resElem = select;
                } else {
                    let input = $('<input>')
                        .addClass('form-control')
                        .attr('type', 'number')
                        .attr('step', 1);
                    FuUiform._condAttr(input, 'min', schemaItem.minimum);
                    FuUiform._condAttr(input, 'max', schemaItem.maximum);
                    resElem = input;
                }
                break;
            case 'number':
                resElem = $('<input>')
                    .addClass('form-control')
                    .attr('type', 'number')
                    .attr('step', 0.001);
                break;
            case 'boolean':
                if (schemaItem['anyOf']) {
                    let select = $('<select>')
                        .addClass('select-no-search')
                        .addClass('form-control');
                    FuUiform._addEmptyOption(select);
                    schemaItem['anyOf'].forEach(optSpec => {
                        select.append($('<option>').attr('value', optSpec['const']).text(optSpec['description']));
                    });
                    resElem = select;
                } else {
                    resElem = $('<input>')
                        .addClass('form-check-input')
                        .addClass('form-control')
                        .attr('type', 'checkbox')
                }
                break;
            default:
                throw `Unknown schema type "${schemaItem.type}"`;
        }

        if (!resElem.data('type')) {
            resElem.data('type', schemaItem.type);
        }
        resElem.attr('id', formItem.id);
        return resElem;
    }

    static _condAttr(elem, name, value, def = null) {
        if (value) {
            elem.attr(name, value);
        } else if (def != null) {
            elem.attr(name, def);
        }
    }

    static _addEmptyOption(select) {
        select.append($('<option>').attr('value', '').text(' - prázdné -'));
    }
}