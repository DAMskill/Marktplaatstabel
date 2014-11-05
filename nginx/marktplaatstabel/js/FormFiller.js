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

    function FormFiller(eventHandler, recordStatusHandler) {

        this.record = null;
        // Target window is set in FormFiller.fillForm()
        this.targetWindow = null;

        // Set FormFiller.eventHandler. See also instantiation in HTMLTableHandler.onClickRecord().
        this.eventHandler = eventHandler;
        this.recordStatusHandler = recordStatusHandler;
        this.errors = [];
        this.postPictureErrors = [];

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

    FormFiller.prototype.fillForm = function(targetWindow, record, callbackOnReady) {

        // Window with the form to fill
        this.record = record;
        this.targetWindow = targetWindow;
        this.$ = targetWindow.$;

        // Clear errors
        this.postPictureErrors = [];

        // Add a new jQuery Sizzle pseudo selector
        this.$.find.selectors.pseudos.Contains = function(a, i, m) {
            // case-insensitive
            return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
        };

        /* Walk through rules per URL, and pass record and rule object to the
         * handler.
         */
        var _this = this;
        $.each(RulesWithHandlerPerURL, function(URLregexp, formFillRuleGroup) {
            if (_this.targetWindow.document.URL.match(URLregexp) !== null) {
                $.each(formFillRuleGroup, function(ix, rule) {
                    rule.handler.call(_this,rule.rules, record);
                });
            }
        });
        if (typeof callbackOnReady==="function")
            callbackOnReady();
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
                if (this.record.category1==="Auto's") {
                    return this.$("#syi-categories-l2 ul.listbox")[0];
                }
                else return this.$("#syi-categories-bucket ul.listbox")[0];
            },
            "action": function(categoryString, uniqueIDString, maxRetries) {

                // Handling of licenseplate
                if (this.record.category1==="Auto's") {

                    var _this = this;

                    if (categoryString.length===8 && categoryString.split("-").length===3) {
                        if (!CookieHandler.isUserLoggedIn()) {
                            this.eventHandler.cancelSlot(uniqueIDString);
                            this.errors.push("Voor het zoeken op nummerplaat dient u eerst in te loggen");
                        }
                        else {
                            this.$("#syi-categories-title").click();
                            this.$("#licensePlate").val(categoryString);

                            var condition = function() { if (_this.$("#licensePlate:visible").length > 0) return true; } 
                            var action = function() { _this.$("#search-licenseplate-button").click(); }

                            waitForConditionAndExecute.call(this, uniqueIDString, condition, action, maxRetries);
                        }
                    }
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
                    var dropdownLabel = _this.$("label.form-label:Contains('" + item[0] + "')");
                    var targetUL = dropdownLabel.parent().find("ul.item-frame");
                    var targetLI = targetUL.find("li").filter(function() {
                        return $(this).text().toUpperCase() === item[1].toUpperCase();
                    });
                    targetLI.click();
                    return (dropdownLabel.parent().find("span.label").text().toUpperCase().indexOf(item[1].toUpperCase()) != -1);
                }

                var condition = function() {
                    if (_this.$("label.form-label:Contains('" + item[0] + "')").filter(":visible").length > 0) return true;
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

                var action = function() {
                    if (_this.$("iframe#description_ifr").contents().find("body#tinymce").length === 1 && 
                            _this.targetWindow.tinymce.activeEditor.initialized===true) 
                    {
                        _this.$("iframe#description_ifr").contents().find("body#tinymce").html(item);
                    } else return false;
                }
                var condition = function() {
                    if (_this.$("iframe#description_ifr").length === 1) {
                        return true;
                    }
                };
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
                    this.$("div.form-field div label:Contains('" + pricetype + "')").parent().find("input:first").prop('checked', true);
                }
            }
        },
        "otherpricetype": {
            "action": function(item, uniqueIDString, maxRetries) {

                var _this = this;
                var action = function() {
                    var label = _this.$("a:Contains('Kies ander prijstype')");
                    label.click();
                    var targetUL = label.parent().parent().find("ul.item-frame");
                    var targetLI = targetUL.find("li").filter(function() {
                        return $(this).text().toUpperCase() === item.toUpperCase();
                    });
                    targetLI.click();
                    return (label.parent().parent().find("span.label").text().toUpperCase().indexOf(item.toUpperCase()) != -1);
                }
                var condition = function() {
                    return true;
                };
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
            "action": function(item) {
                if (!this.$("label:Contains('" + item[0] + "')").length>0) {
                    this.errors.push(item[0] + " niet gevonden");
                }
                else {
                    this.$("label:Contains('" + item[0] + "')").next().val(item[1]);
                }
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
        "https://localhost/syi/plaatsAdvertentie": [{
            /* Category selection rules */
            "rules": CategoryRules,
            "handler": categoryHandler
        }],
        "https://localhost/syi/.*/plaatsAdvertentie.*": [{
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
            url: "php/voegFotoToe.php",
            dataType: "json",
            tryCount: 0,
            retryLimit: 3,
            data: {
                xsrfToken: _this.$("input[name='nl.marktplaats.xsrf.token']").val(),
                mpSessionID: CookieHandler.getCookie('MpSession'),
                picturePath: picPath
            },
            success: function(data) {
                if ('error' in data) {
                    _this.$("div#syi-upload").append("<div class='fileNotFound'>"+data.error+"</div>");
                    postPictureErrorHandler.call(_this, data.error, uniqueIDString);
                }
                else {
                    var condition = function() {
                        if (_this.$("div.uploader-container.empty:first > input[name='images.ids']").length > 0) return true;
                    };
                    var action = function() {
                        /* Pass index too, the first picture could return later than the second */
                        setImage.call(_this, ix, data);
                    };
                    waitForConditionAndExecute.call(_this, uniqueIDString, condition, action, maxRetries);
                }
            },
            error: function(xhr, textStatus, errorThrown) {

                var error = "Foto '"+picPath+"' toevoegen mislukt";

                if (xhr.status === 500 || textStatus === 'timeout') {

                    if (++this.tryCount <= this.retryLimit) {
                        // retry picture upload
                        $.ajax(this);
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
            if (name in record === false) {
                return;
            }

            if (typeof record[name] === 'object') {

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
             * Sometimes category 1 is filled before mutation observer is observing.
             * The category will then be selected by the action function of the rule.
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
