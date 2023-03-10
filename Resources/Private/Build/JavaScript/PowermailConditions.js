import Utility from './Utility';

class PowermailConditions {
  'use strict';

  /**
   * Form element (filled via constructor)
   */
  #form;

  constructor(form) {
    this.#form = form;
    this.#form.powermailConditions = this;
  }

  initialize = function () {
    const that = this;
    that.#sendFormValuesToPowermailCond();
    that.#fieldListener();
  }

  #fieldListener() {
    const that = this;
    const fields = this.#getFieldsFromForm();
    fields.forEach((field) => {
      field.addEventListener('change', function(event) {
        that.#sendFormValuesToPowermailCond();
      })
    });
  }

  #sendFormValuesToPowermailCond () {
    const that = this;
    that.#enableAllFields();
    fetch(this.#getAjaxUri(), {body: new FormData(this.#form), method: 'post'})
      .then((resp) => resp.json())
      .then(function(data) {
        if (data.loops > 99) {
          console.log('Too much loops reached by parsing conditions and rules. Check for conflicting conditions.');
        } else {
          that.#processActions(data);
        }
      })
      .catch(function(error) {
        console.log(error);
      });
  };

  #processActions(data) {
    if (data.todo !== undefined) {
      for (let formUid in data.todo) {
        for (let pageUid in data.todo[formUid]) {

          // do actions with whole pages
          if (data.todo[formUid][pageUid]['#action'] === 'hide') {
            this.#hidePage(this.#getFieldsetByUid(pageUid));
          }
          if (data.todo[formUid][pageUid]['#action'] === 'un_hide') {
            this.#showPage(this.#getFieldsetByUid(pageUid));
          }

          // do actions with single fields
          for (var fieldMarker in data.todo[formUid][pageUid]) {
            if (data.todo[formUid][pageUid][fieldMarker]['#action'] === 'hide') {
              this.#hideField(fieldMarker);
            }
            if (data.todo[formUid][pageUid][fieldMarker]['#action'] === 'un_hide') {
              this.#showField(fieldMarker);
            }
          }

        }
      }
    }
  };

  #enableAllFields() {
    const fields = this.#form.querySelectorAll('[disabled="disabled"]');
    fields.forEach((field) => {
      field.removeAttribute('disabled');
    });
  };

  #getFieldsFromForm() {
    return this.#form.querySelectorAll(
      'input:not([data-powermail-validation="disabled"]):not([type="hidden"]):not([type="submit"])'
      + ', textarea:not([data-powermail-validation="disabled"])'
      + ', select:not([data-powermail-validation="disabled"])'
    );
  };

  #getAjaxUri() {
    const container = document.querySelector('[data-condition-uri]');
    if (container === null) {
      console.log('Tag with data-condition-uri not found. Maybe TypoScript was not included.');
    }
    return container.getAttribute('data-condition-uri');
  };

  #showField(fieldMarker) {
    let field = this.#getFieldByMarker(fieldMarker);
    let isHidden = false;
    if (field) {
      let wrappingContainer = field.closest('.powermail_fieldwrap');
      isHidden = field.getAttribute('type') === 'hidden';
      Utility.showElement(wrappingContainer);
      field.removeAttribute('disabled');
      this.#rerequireField(field);
    }

    if (field && isHidden) {
      let fields = this.#getMultiValueFieldsByMarker(fieldMarker);
      fields.forEach(field => {
        field.removeAttribute('disabled');
        this.#rerequireField(field);
      });
    }
  };

  #hideField(fieldMarker) {
    let field = this.#getFieldByMarker(fieldMarker);
    let isHidden = false;
    if (field) {
      let wrappingContainer = field.closest('.powermail_fieldwrap');
      isHidden = field.getAttribute('type') === 'hidden';
      Utility.hideElement(wrappingContainer);
      field.setAttribute('disabled', 'disabled');
      this.#derequireField(field);
    }

    if (field && isHidden) {
      let fields = this.#getMultiValueFieldsByMarker(fieldMarker);
      fields.forEach(field => {
        field.setAttribute('disabled', 'disabled');
        this.#derequireField(field);
      });
    }
  };

  #showPage(page) {
    Utility.showElement(page);
  };

  #hidePage(page) {
    Utility.hideElement(page);
  };

  #derequireField(field) {
    if (field.hasAttribute('required') || field.hasAttribute('data-powermail-required')) {
      field.removeAttribute('required');
      field.removeAttribute('data-powermail-required');
      field.setAttribute('data-powermailcond-required', 'required');
    }
  };

  #rerequireField(field) {
    if (field.getAttribute('data-powermailcond-required') === 'required') {
      if (this.#isHtml5ValidationActivated() || this.#isPowermailValidationActivated()) {
        field.setAttribute('required', 'required')
      }
    }
    field.removeAttribute('data-powermailcond-required');
  };

  #isPowermailValidationActivated() {
    return this.#form.getAttribute('data-powermail-validate') === 'data-powermail-validate';
  };

  #isHtml5ValidationActivated() {
    return this.#form.getAttribute('data-validate') === 'html5';
  };

  #getFieldByMarker(fieldMarker) {
    return this.#form.querySelector('[name="tx_powermail_pi1[field][' + fieldMarker + ']"]');
  };

  #getMultiValueFieldsByMarker(fieldMarker) {
    return this.#form.querySelectorAll('[name="tx_powermail_pi1[field][' + fieldMarker + '][]"]');
  };

  #getFieldsetByUid(pageUid) {
    return this.#form.querySelector('.powermail_fieldset_' + pageUid);
  };
}

const forms = document.querySelectorAll('.powermail_form');
forms.forEach(function(form) {
  let powermailConditions = new PowermailConditions(form);
  powermailConditions.initialize();
});
