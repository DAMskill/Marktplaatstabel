/*******************************************************************************
 * Copyright (c) 2014 Ivo van Kamp
 *
 * This file is part of Marktplaatstabel.
 *
 * Marktplaatstabel is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Marktplaatstabel is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

/* Example record parameter for fillForm function
 * ----------------------------------------------
 *    var record = {
 *        "nrofrows": 10,
 *        "category1": "Huis en Inrichting",
 *        "category2": "Kasten",
 *        "category3": "Kledingkasten",
 *        "category": ["Huis en Inrichting", "Kasten", "Kledingkasten"],
 *        "dropdowns": [
 *            ["conditie", "gebruikt"],
 *            ["hoogte", "200 cm of meer"],
 *            ["breedte", "200 cm of meer"],
 *            ["diepte", "50 tot 75 cm"]
 *        ],
 *        "checkboxes": ["met deur(en)", "met plank(en)", "met hangruimte"],
 *        "pictures": ["C:\\Users\\username\\Pictures\\paxmalm1.jpg"],
 *        "title": "Kledingkast wit met spiegel schuifdeur",
 *        "advertisement": "Garderobekast in goede staat met schuifdeuren (1 wit en 1 met spiegel)<br>\nPax Malm (Ikea)",
 *        "inputfields": [
 *            ["Start bieden vanaf", "20"]
 *        ],
 *        "price"          :  50,
 *        "pricetype"      :  "Start bieden vanaf",
 *        "paypal"         :  "nee"
 *    };
 */

var FormFiller = (function() {

    "use strict";

    function FormFiller(targetWindow, eventHandler, recordStatusHandler) {

        this.record = null;
        this.targetWindow = targetWindow; // Window with the form to fill

        this.eventHandler = eventHandler;
        this.recordStatusHandler = recordStatusHandler;
        this.errors = [];
        this.postPictureErrors = [];

        this.nginxPlaceAdURI = "/ajaxPlaatsAdvertentie.html";
        this.placeAddURI = "http://ssl.marktplaatstabel.services/syi/plaatsAdvertentie.html";

        this.mutationCriteria = {
            childList: true,
            characterData: true,
            subtree: true
        }
    }

    FormFiller.prototype.isActive = function() {
        return this.eventHandler.isActive();
    }

    FormFiller.prototype.getRecord = function() {
        return this.record;
    }

    FormFiller.prototype.getErrors = function() {
        return this.eventHandler.getErrors().concat(this.postPictureErrors).concat(this.errors);
    }

    FormFiller.prototype.hasErrors = function() {
        return this.getErrors().length!==0;
    }

    FormFiller.prototype.clearAllIntervals = function() {
	this.eventHandler.clearAllIntervals();
    }

    FormFiller.prototype.inFinalForm = function() {
        if (this.windowUrlOnStartFillForm.match("http://ssl.marktplaatstabel.services/syi/.*/plaatsAdvertentie.*")!==null)
        {
            return true;
        }
        return false;
    }

    FormFiller.prototype.fillForm = function(record, callbackWhenReady) {

        var _this = this;
        var condition = function() {
            return (typeof _this.targetWindow.$!=='undefined' && typeof _this.targetWindow.document!=='undefined');
        } 
        var action = function() { realFillForm(_this, record, callbackWhenReady); }

        // Wait for jQuery after loading the window (necessary for Safari)
        waitForConditionAndExecute.call(_this, "wachten op formulier", condition, action, 10);
    }

    function realFillForm(_this, record, callbackWhenReady) {

        console.log(9);
        _this.record = record;
        _this.windowUrlOnStartFillForm = _this.targetWindow.document.URL;
        _this.$ = _this.targetWindow.$; // jQuery shortcut ($ variable) of targetWindow

        // Clear errors
        _this.errors = [];
        _this.postPictureErrors = [];
        _this.eventHandler.clearErrors();

        // Add a new jQuery Sizzle pseudo selector
        _this.$.find.selectors.pseudos.Contains = function(a, i, m) {
            // case-insensitive
            return (a.textContent || a.innerText || "").toUpperCase().replace(/\s/g,'').indexOf(m[3].toUpperCase().replace(/\s/g,'')) >= 0;
        };

        /* Walk through rules per URL, and pass record and rule object to the
         * handler.
         */
        $.each(RulesWithHandlerPerURL, function(URLregexp, formFillRuleGroup) {
            if (_this.targetWindow.document.URL.match(URLregexp) !== null) {
                $.each(formFillRuleGroup, function(ix, rule) {
                    rule.handler.call(_this,rule.rules, record);
                });
            }
        });
        if (typeof callbackWhenReady==="function")
            callbackWhenReady();
    }

    FormFiller.prototype.submitFormWithAjax = function(callOnSuccess, callOnFailure) {

        // Get description from tinymce iframe and copy it to textarea#description of the form
        var description = this.targetWindow.$("iframe#description_ifr").contents().find("body#tinymce").html();
        this.targetWindow.$("textarea#description").html(description);

        var form = this.targetWindow.$("#syi-form");

        // Marktplaats.nl JS code replaces the value of each input element
        // with the value of attribute data-placeholder if it exists. This
        // simulates the HTML5 placeholder attribute. Clear these values
        // before filling out the form to prevent submitting the help text
        // of these input fields (e.g. microTipText contains the text
        // 'Bijvoorbeeld AANBIEDING' as the placeholder).
        form.find(":input[data-placeholder]").val('');
 
        // Serialize all form data to post.
        var postData = form.serialize();

        $.ajax(
        {
            url  : this.nginxPlaceAdURI, // see also: constructor and nginx.conf
            type : "POST",
            data : postData,
            async: false, // Don't start new form until successful submission
            success:function(data, textStatus, jqXHR) 
            {
		callOnSuccess();
            },
            // Form submission might fail due to network or other errors.
            error: function(jqXHR, textStatus, errorThrown) 
            {
		callOnFailure();
            }
        });
    }

    FormFiller.prototype.goToPlaceAddURL = function() {
        try {
            if (this.targetWindow.document.URL!==this.placeAddURI) {
	    	this.targetWindow.location = this.placeAddURI;
                return true;
            }
            return false;
        }
        catch (error) {
            // SecurityError (see https://html.spec.whatwg.org)
            if (error.code===18) {
                alert("Toegangsfout, website wordt herladen. ("+error+")");
                location.reload();
            }
            return false;
        }
    }

    FormFiller.prototype.canValidateForm = function() {
        try {
            var childViews = getAuroraChildViews(this);
            return isChildViewsReadyForFormSubmission(childViews);
        }
        catch(error) {
            return false;
        }
    }

    FormFiller.prototype.validateForm = function() {
        try {
            var childViews = getAuroraChildViews(this);
            childViews.form.beforeSubmit();
            return childViews.form.noErrorsFound();
        }
        catch(error) {
            return false;
        }
    }

    function getAuroraChildViews(_this) {
        if (typeof(_this.targetWindow.AURORA.Pages.syi)!=='undefined')
            return _this.targetWindow.AURORA.Pages.syi.childViews;
        else 
            return _this.targetWindow.AURORA.Pages.Syi.childViews;
    }

    function isChildViewsReadyForFormSubmission(childViews) {
        if (typeof childViews.descriptionEditor._initValidation === 'undefined' || 
            typeof childViews.form.beforeSubmit === 'undefined' ||
            typeof childViews.descriptionEditor.rteInstance === 'undefined'
            )
        {
            return false;
        }
        return true;
    }

    function waitForConditionAndExecute(uniqueIDString, condition, action, maxRetries) {
        var _this = this;
        var callback = function() {
            _this.recordStatusHandler("Bezig met: " + uniqueIDString);
        }
        this.eventHandler.waitForConditionAndExecute(uniqueIDString, condition, action, null, callback, maxRetries);
    }

    /* Rules: each rule has a name which corresponds with a field in
     * record, followed by one or multiple fields handled by the
     * rule handler specified in RulesWithHandlerPerURL.
     */
    var CategoryRules = {
        "category1": {
            "target": function() {
                return this.$("#syi-categories-l1 ul.listbox")[0];
            },
            /* Click on first category when first category list is preloaded to set MutationObserver in motion */
            "action": function(categoryString) {
                this.$("#syi-categories-title").click();
                this.$("#syi-categories-l1 ul.listbox li").filter(function() {
                    return $.trim($(this).text().toUpperCase()) === $.trim(categoryString.toUpperCase());
                }).click();
            }
        },
        "category2": {
            "target": function() {
                // Category Auto's has only one subcategory
                if (this.record.category1.toUpperCase()==="AUTO'S") {
                    return this.$("#syi-categories-l2 ul.listbox")[0];
                }
                else return this.$("#syi-categories-bucket ul.listbox")[0];
            },
            "action": function(categoryString, uniqueIDString, maxRetries) {

                // Handling of licenseplate
                if (this.record.category1.toUpperCase()==="AUTO'S" &&
                    categoryString.length===8 && 
                    categoryString.split("-").length===3) 
                {
                    this.$("#categories-wrap").show();
                    this.$("#licensePlate").val(categoryString);

                    var _this = this;
                    var condition = function() { if (_this.$("#licensePlate:visible").length > 0) return true; } 
                    var action = function() { _this.$("#search-licenseplate-button").click(); }

                    waitForConditionAndExecute.call(this, uniqueIDString, condition, action, maxRetries);
                }
            },
            "maxRetries": 10,
            "getUniqueSlotID": function(item) {
                return "keuzelijst '" + item + "'";
            }
        },
        "category3": {
            "target": function() {
                return this.$("#syi-categories-l2 ul.listbox")[0];
            }
        }
    };

    var FormRules = {
        "title": {
            "action": function(title) {
                this.$("input[name=title]").val(title);
            }
        },
        "dropdowns": {
            "action": function(item, uniqueIDString, maxRetries) {

                var _this = this;
                var action = function() {
                    var dropdownLabel = _this.$(".form-label:Contains('" + item[0] + "')");

                    var targetSelect = dropdownLabel.parent().find("select:enabled");

                    var targetOption = targetSelect.find("option:enabled").filter(function() {
                        return $(this).text().toUpperCase().replace(/\s/g,'') === item[1].toUpperCase().replace(/\s/g,'');
                    });

                    targetOption.prop('selected', true);
                    targetSelect.change();
                    return targetSelect.val()!=="" && typeof targetSelect.val()!=="undefined";
                }

                var condition = function() {
                    if (_this.$(".form-label:Contains('" + item[0] + "')").filter(":visible").length > 0) return true;
                };
                waitForConditionAndExecute.call(this, uniqueIDString, condition, action, maxRetries);
            },
            "maxRetries": 10,
            /* getUniqueSlotID is used to initialize eventHandler.domChangeTimers object
             * with an empty string id property for each dropdown. These will be removed 
             * when eventHandler.waitForConditionAndExecute action finishes successfully.
             */
            "getUniqueSlotID": function(item) {
                return "keuzelijst '" + item[0] + "'";
            }
        },
        "advertisement": {
            "action": function(item, uniqueIDString, maxRetries) {

                var _this = this;

                // Returns true if TinyMCE iFrame is available
                var condition = function() {
                    if (_this.$("iframe#description_ifr").length === 1) {
                        return true;
                    }
                };
                // Returns false if TinyMCE is not ready, after which the action is retried.
                var action = function() {
                    if (_this.$("iframe#description_ifr").contents().find("body#tinymce").length === 1 && 
                            _this.targetWindow.tinymce.activeEditor.initialized===true) 
                    {
                        _this.$("iframe#description_ifr").contents().find("body#tinymce").html(item);
                    } 
                    else return false;
                }

                waitForConditionAndExecute.call(this, uniqueIDString, condition, action, maxRetries);
            },
            "maxRetries": 10,
            /* String used to book a slot before firing action. See also dropdown getUniqueSlotID. */
            "getUniqueSlotID": function() {
                return "wachten op advertentie tekstvak";
            }
        },
        "price": {
            "action": function(price) {
                this.$("input[name='price.value']").val(price);
            }
        },
        "pricetype": {
            "action": function(pricetype) {
                if (!this.$("div.form-field div label:Contains('" + pricetype + "')").length>0) {
                    this.errors.push("Prijstype " + pricetype + " niet gevonden");
                }
                else {
                    this.$("div.form-field div label:Contains('" + pricetype + "')").parent().find("input:first").click();
                }
            }
        },
        "otherpricetype": {
            "action": function(item, uniqueIDString, maxRetries) {

                var _this = this;
                var condition = function() { return true; };
                var action = function() {
                    var label = _this.$("a:Contains('Kies ander prijstype')");
                    label.click();
                    var targetSelect = label.parent().parent().find("select");
                    var targetOption = targetSelect.find("option").filter(function() {
                        return $(this).text().toUpperCase() === item.toUpperCase();
                    });
                    return targetOption.prop('selected', true);
                }
                waitForConditionAndExecute.call(this, uniqueIDString, condition, action, maxRetries);
            },
            "maxRetries": 10,
            /* getUniqueSlotID is used to initialize eventHandler.domChangeTimers object
             * with an empty string id property for each dropdown. These will be removed 
             * when eventHandler.waitForConditionAndExecute action finishes successfully.
             */
            "getUniqueSlotID": function(item) {
                return "ander prijstype '" + item + "'";
            }
        },
        "paypal": {
            "action": function(paypal) {
                var check = (paypal.toUpperCase() == "JA") ? true : false;
                this.$("input#accept-paypal-switch").prop('checked', check)
            }
        },
        "checkboxes": {
            "action": function(item) {
                if (!this.$("label:Contains('" + item + "')").length>0) {
                    this.errors.push(item + " niet gevonden");
                }
                else {
                    this.$("label:Contains('" + item + "')").parent().find("input[type='checkbox']").prop('checked', true);
                }
            }
        },
        "inputfields": {
            "action": function(item, uniqueIDString, maxRetries) {
                var _this = this;
                var condition = function() {
                    return (_this.$("label:Contains('" + item[0] + "')").parent().find("input[type='text']:first:enabled").length>0);
                };
                var action = function() {
                    return _this.$("label:Contains('" + item[0] + "')").parent().find("input[type='text']:first:enabled").val(item[1]);
                }
                waitForConditionAndExecute.call(this, uniqueIDString, condition, action, maxRetries);
            },
            "maxRetries": 10,
            "getUniqueSlotID": function(item) {
                return "invoerveld '" + item[0] + "'";
            }
        }
    };


    var PictureRules = {
        "pictures": {
            "action": function(ix, picPath, uniqueIDString, maxRetries) {
                postPicture.call(this, ix, picPath, uniqueIDString, maxRetries);
            },
            "getUniqueSlotID": function(ix) {
                return "foto " + (ix + 1) + " toevoegen";
            },
            "maxRetries": 10
        }
    }

    var RulesWithHandlerPerURL = {
        "http://ssl.marktplaatstabel.services/syi/plaatsAdvertentie": [{
            /* Category selection rules */
            "rules": CategoryRules,
            "handler": categoryHandler
        }],
        "http://ssl.marktplaatstabel.services/syi/.*/plaatsAdvertentie.*": [{
            /* Picture upload rules */
            "rules": PictureRules,
            "handler": pictureHandler
        }, {
            /* Form field filler rules */
            "rules": FormRules,
            "handler": formHandler
        }]
    }

    function postPictureErrorHandler(errorMessage, uniqueIDString) {
        this.postPictureErrors.push(errorMessage);
        this.eventHandler.cancelSlot(uniqueIDString);
    }

    function postPicture(ix, picPath, uniqueIDString, maxRetries) {

        var _this = this;
        $.ajax({
            type: "POST",
            url: "http://ssl.marktplaatstabel.services/postPicture",
            dataType: "json",
            tryCount: 0,
            retryLimit: 10,
            data: JSON.stringify({
                xsrfToken: _this.$("input[name='nl.marktplaats.xsrf.token']").val(),
                mpSessionID: CookieHandler.getCookie('MpSession'),
                picturePath: picPath
            }),
            success: function(data) {
                if ('error' in data) {
                    _this.$("div#syi-upload").append("<div class='fileNotFound'>"+data.error+"</div>");
                    postPictureErrorHandler.call(_this, data.error, uniqueIDString);
                }
                else {
                    // Ensure image container is available
                    var condition = function() {
                        var imgUploadContainer = _this.$("div.uploaders div.uploader-container").eq(ix);
                        var inputImagesIds = imgUploadContainer.find("> input[name='images.ids']");
                        if (inputImagesIds.length > 0) return true;
                    };
                    var action = function() {
                        /* Pass index too, the first picture could return later than the second */
                        setImage.call(_this, ix, data);
                    };
                    waitForConditionAndExecute.call(_this, uniqueIDString, condition, action, maxRetries);
                }
            },
            error: function(xhr, textStatus, errorThrown) {

                var _thisAjax = this;
                var error = "Foto '"+picPath+"' toevoegen mislukt";

                //console.log("error: "+xhr.status +" "+xhr.textStatus+" "+errorThrown);

                if (xhr.status === 500 || textStatus === 'timeout' || textStatus === 'parsererror') {

                    if (++this.tryCount <= this.retryLimit) {
                        // retry picture upload
                        setTimeout(function(){$.ajax(_thisAjax)}, 200);
                    }
                    else {
                        postPictureErrorHandler.call(_this, error, uniqueIDString);
                    }
                }
                else {
                    postPictureErrorHandler.call(_this, error, uniqueIDString);
                }
            }
        });
    }

    function setImage(ix, imgData) {

        var imgUploadContainer = this.$("div.uploaders div.uploader-container").eq(ix);
        var imageUrl = (imgUploadContainer.hasClass('large') ? imgData.largeImageUrl : imgData.imageUrl);

        imgUploadContainer.find("> input[name='images.ids']").val(imgData.id);
        imgUploadContainer.find("div.thumb").append("<img src='" + imageUrl + "'>").css({
            "width": "100%",
            "height": "100%"
        });

        imgUploadContainer.find("div.large-photo-subtext").hide();
        imgUploadContainer.find("img.image-upload-logo").hide();
        imgUploadContainer.find("span.uploader-label").hide();
        imgUploadContainer.removeClass("empty").addClass("complete");

        // Add new image upload container (support for new type of responsive upload containers).
        try {
            var eventData = {};
            eventData.isImageBeingReplaced = false;
            this.targetWindow.AURORA.Pages.Syi.childViews.uploaders.newImageUploader(eventData);
        }
        catch(error) {
        }
    }

    function pictureHandler(rule, record) {
        var _this = this;
        if ("pictures" in record) {
            $.each(record.pictures, function(ix, picPath) {
                if ($.trim(picPath)==="") return;
                _this.eventHandler.reserveSlot(rule.pictures.getUniqueSlotID(ix));
            });
            $.each(record.pictures, function(ix, picPath) {
                if ($.trim(picPath)==="") return;
                rule.pictures.action.call(_this, ix, picPath, rule.pictures.getUniqueSlotID(ix), rule.pictures.maxRetries);
            });
        }
    }

    function formHandler(rules, record) {

        var _this = this;
        $.each(rules, function(name, rule) {

            /* Field not in found in record, continue with next rule */
            if (name in record === false || record[name]==="" || record[name]===null) {
                return;
            }

            if (record[name]!==null && typeof record[name] === 'object') {

                if (typeof rule.getUniqueSlotID=== 'function') {
                    $.each(record[name], function(ix, item) { 
                        _this.eventHandler.reserveSlot(rule.getUniqueSlotID(item)); 
                    });
                    $.each(record[name], function(ix, item) { 
                        rule.action.call(_this, item, rule.getUniqueSlotID(item), rule.maxRetries);
                    });
                }
                else {
                    $.each(record[name], function(ix, item) { rule.action.call(_this, item); });
                }
            }
            else {
                if (typeof rule.getUniqueSlotID=== 'function') {
                    _this.eventHandler.reserveSlot(rule.getUniqueSlotID(record[name]));
                    rule.action.call(_this, record[name], rule.getUniqueSlotID(record[name]), rule.maxRetries);
                }
                else {
                    rule.action.call(_this, record[name]);
                }
            }
        });
    }

    function categoryHandler(rules, record) {

        var _this = this;
        $.each(rules, function(name, rule) {

            if (name in record === false) {
                return;
            }

            function mutationObjectCallback(mutationRecordsList) {
                mutationRecordsList.forEach(function(mutationRecord) {
                    if ("childList" === mutationRecord.type) {
                        var addedLIText = $(mutationRecord.addedNodes.item(0)).text();
                        if (addedLIText === record[name]) {
                            $(mutationRecord.addedNodes.item(0)).click();
                        }
                    }
                });
            }

            if (typeof rule.target !== 'undefined') {
                var observer = new MutationObserver(mutationObjectCallback);
                observer.observe(rule.target.call(_this), _this.mutationCriteria);
            }
            /* 
             * If a category list is (pre)filled before mutation observer is observing,
             * then the category will be selected by the action function of the rule.
             */
            if ("action" in rule !== false) {
                if (typeof rule.getUniqueSlotID=== 'function') {
                    _this.eventHandler.reserveSlot(rule.getUniqueSlotID(name));
                    rule.action.call(_this, record[name], rule.getUniqueSlotID(name), rule.maxRetries);
                }
                else {
                    rule.action.call(_this, record[name]);
                }
            }
        });
    }

    return FormFiller;

})();
