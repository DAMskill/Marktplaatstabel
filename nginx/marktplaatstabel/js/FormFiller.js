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

var FormFiller = (function() {

    "use strict";

    // Reference to Marktplaats.nl's jQuery object, initialized in fillForm() 
    var $$ = null;

    var mutationCriteria = {
        childList: true,
        characterData: true,
        subtree: true
    }

    var checkIfReady = null;

    function setStatusMessage(text) {
        $("#status").css("color","#21469e").text(text);
    }

    function setErrorMessage(text) {
        $("#status").css("color","#d01f3c").text(text);
    }

    function waitForConditionAndExecute(uniqueIDString, condition, action, time) {
        setStatusMessage("Bezig met: " + uniqueIDString);
        EventHandler.waitForConditionAndExecute(uniqueIDString, condition, action, time);
    }

    /* Example record
    var record = {
        "nrofrows": 10,
        "category1": "Huis en Inrichting",
        "category2": "Kasten",
        "category3": "Kledingkasten",
        "category": ["Huis en Inrichting", "Kasten", "Kledingkasten"],
        "dropdowns": [
            ["conditie", "gebruikt"],
            ["hoogte", "200 cm of meer"],
            ["breedte", "200 cm of meer"],
            ["diepte", "50 tot 75 cm"]
        ],
        "checkboxes": ["met deur(en)", "met plank(en)", "met hangruimte"],
        "pictures": ["C:\\Users\\z\\Pictures\\paxmalm1.jpg"],
        "title": "Kledingkast wit met spiegel schuifdeur",
        "advertisement": "Garderobekast in goede staat met schuifdeuren (1 wit en 1 met spiegel)<br>\nPax Malm (Ikea)",
        "inputfields": [
            ["Start bieden vanaf", "20"]
        ],
        "price"          :  50,
        "pricetype"      :  "Start bieden vanaf",
        "paypal"         :  "nee"
    };
    */
    function fillForm(record) {

        clearInterval(checkIfReady);

        // iFrame showing Marktplaats.nl through localhost proxy
        var myframeWindow = document.getElementById("myframe").contentWindow;

        // Use $$ to reference Marktplaats.nl's jQuery object inside iFrame.
        $$ = myframeWindow.$;

        // Add a new jQuery Sizzle pseudo selector
        $$.find.selectors.pseudos.Contains = function(a, i, m) {
            // case-insensitive
            return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
        };

        /* Walk through rules per URL, and pass record and rule object to the
         * handler.
         */
        var a=0;
        $.each(RulesWithHandlerPerURL, function(URLregexp, formFillRuleGroup) {
            if (myframeWindow.document.URL.match(URLregexp) !== null) {
                $.each(formFillRuleGroup, function(ix, rule) {
                    rule.handler(rule.rules, record);
                });
            }
        });

        // Check if EventHandler.waitForConditionAndExecute() is active
        checkIfReady = setInterval(function() {
            if (EventHandler.isActive()===false) {
                setStatusMessage("Excel record succesvol ingevuld");
                clearInterval(checkIfReady);
            }
        }, 1000);
    }

    /* Rules: each rule has a name which corresponds with a field in
     * record, followed by one or multiple fields handled by the
     * rule handler specified in RulesWithHandlerPerURL.
     */
    var CategoryRules = {
        "category1": {
            "target": function() {
                return $$("#syi-categories-l1 ul.listbox")[0];
            },
            /* Click on first category when first category list is preloaded to set MutationObserver in motion */
            "action": function(categoryString) {
                $$("#syi-categories-l1 ul.listbox li").filter(function() {
                    return $.trim($(this).text().toUpperCase()) === $.trim(categoryString.toUpperCase());
                }).click();
            }
        },
        "category2": {
            "target": function() {
                return $$("#syi-categories-bucket ul.listbox")[0];
            }
        },
        "category3": {
            "target": function() {
                return $$("#syi-categories-l2 ul.listbox")[0];
            }
        }
    };

    var FormRules = {
        "title": {
            "action": function(title) {
                $$("input[name=title]").val(title);
            }
        },
        "dropdowns": {
            "action": function(item) {

                var action = function() {
                    var dropdownLabel = $$("label.form-label:Contains('" + item[0] + "')");
                    var targetUL = dropdownLabel.parent().find("ul.item-frame");
                    var targetLI = targetUL.find("li").filter(function() {
                        return $(this).text().toUpperCase() === item[1].toUpperCase();
                    });
                    targetLI.click();
                    return (dropdownLabel.parent().find("span.label").text().toUpperCase().indexOf(item[1].toUpperCase()) != -1);
                }

                var condition = function() {
                    if ($$("label.form-label:Contains('" + item[0] + "')").filter(":visible").length > 0) return true;
                };
                waitForConditionAndExecute("keuzelijst " + item[0], condition, action);
            },
            /* Used to initialize EventHandler.domChangeTimers object with an empty
             * string id property for each dropdown. These will be removed when
             * EventHandler.waitForConditionAndExecute action finishes successfully.
             */
            "getUniqueSlotID": function(item) {
                return "keuzelijst " + item[0];
            }
        },
        "advertisement": {
            "action": function(item, uniqueIDString) {

                var action = function() {
                    var myframeWindow = document.getElementById("myframe").contentWindow;
                    if ($$("iframe#description_ifr").contents().find("body#tinymce").length === 1 && 
                            myframeWindow.tinymce.activeEditor.initialized===true) 
                    {
                        $$("iframe#description_ifr").contents().find("body#tinymce").html(item);
                    } else return false;
                }
                var condition = function() {
                    if ($$("iframe#description_ifr").length === 1) {
                        return true;
                    }
                };
                waitForConditionAndExecute(uniqueIDString, condition, action);
            },
            /* String used to book a slot before firing action. See also dropdown getUniqueSlotID. */
            "getUniqueSlotID": function() {
                return "wachten op advertentie tekstvak";
            }
        },
        "price": {
            "action": function(price) {
                $$("input[name='price.value']").val(price);
            }
        },
        "pricetype": {
            "action": function(pricetype) {
                $$("div.form-field div label:Contains('" + pricetype + "')").parent().find("input:first").prop('checked', true);
            }
        },
        "paypal": {
            "action": function(paypal) {
                var check = (paypal.toUpperCase() == "JA") ? true : false;
                $$("input#accept-paypal-switch").prop('checked', check)
            }
        },
        "checkboxes": {
            "action": function(item) {
                $$("label:Contains('" + item + "')").parent().find("input[type='checkbox']").prop('checked', true);
            }
        },
        "inputfields": {
            "action": function(item) {
                $$("label:Contains('" + item[0] + "')").next().val(item[1]);
            }
        }
    };


    var PictureRules = {
        "pictures": {
            "action": function(ix, picPath, uniqueIDString) {
                setStatusMessage("uploaden foto's");
                postPicture(ix, picPath, uniqueIDString);
            },
            "getUniqueSlotID": function(ix) {
                return "foto " + (ix + 1) + " toevoegen";
            }
        }
    }

    var RulesWithHandlerPerURL = {
        "https://localhost/syi/plaatsAdvertentie": [{
            /* Category selection rules */
            "rules": CategoryRules,
            "handler": categoryHandler
        }],
        "https://localhost/syi/.*/.*/plaatsAdvertentie": [{
            /* Picture upload rules */
            "rules": PictureRules,
            "handler": pictureHandler
        }, {
            /* Form field filler rules */
            "rules": FormRules,
            "handler": formHandler
        }]
    }

    function reserveSlot(uniqueIDString) {
        // Prevent isActive() from returning true until uploading is finished
        EventHandler.reserveSlot(uniqueIDString);
    }

    function postPicture(ix, picPath, uniqueIDString) {

        $.ajax({
            type: "POST",
            url: "php/voegFotoToe.php",
            dataType: "json",
            tryCount: 0,
            retryLimit: 3,
            data: {
                xsrfToken: $("#myframe").contents().find("input[name='nl.marktplaats.xsrf.token']").val(),
                mpSessionID: CookieHandler.getCookie('MpSession'),
                picturePath: picPath
            },
            success: function(data) {
                var condition = function() {
                    if ($("#myframe").contents().find("div.uploader-container.empty:first > input[name='images.ids']").length > 0) return true;
                };
                var action = function() {
                    /* Pass index too, the first picture could return later than the second */
                    setImage(ix, data);
                };
                waitForConditionAndExecute(uniqueIDString, condition, action);
            },
            error: function(xhr, textStatus, errorThrown) {
                if (xhr.status === 500 || textStatus === 'timeout') {
                    this.tryCount++;
                    if (this.tryCount <= this.retryLimit) {
                        //try again
                        $.ajax(this);
                    }
                }
            }
        });
    }

    function setImage(ix, imgData) {

        var imgUploadContainer = $$("div.uploaders div.uploader-container").eq(ix);
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
        if ("pictures" in record) {
            $.each(record.pictures, function(ix, picPath) {
                reserveSlot(rule.pictures.getUniqueSlotID(ix));
            });
            $.each(record.pictures, function(ix, picPath) {
                rule.pictures.action(ix, picPath, rule.pictures.getUniqueSlotID(ix));
            });
        }
    }

    function formHandler(rules, record) {

        $.each(rules, function(name, rule) {

            /* Field not in found in record, continue with next rule */
            if (name in record === false) {
                return;
            }

            if (typeof record[name] === 'object') {

                if (typeof rule.getUniqueSlotID=== 'function') {
                    $.each(record[name], function(ix, item) { reserveSlot(rule.getUniqueSlotID(item));       });
                    $.each(record[name], function(ix, item) { rule.action(item, rule.getUniqueSlotID(item)); });
                }
                else {
                    $.each(record[name], function(ix, item) { rule.action(item); });
                }
            }
            else {
                if (typeof rule.getUniqueSlotID=== 'function') {
                    reserveSlot(rule.getUniqueSlotID());
                    rule.action(record[name], rule.getUniqueSlotID());
                }
                else {
                    rule.action(record[name]);
                }
            }
        });
    }

    function categoryHandler(rules, record) {

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
                observer.observe(rule.target(), mutationCriteria);
            }
            /* 
             * Sometimes category 1 is filled before mutation observer is observing.
             * The category will then be selected by the action function of the rule.
             */
            if ("action" in rule !== false)
                rule.action(record[name]);
        });
    }

    return {
        "fillForm": fillForm,
        "setStatusMessage": setStatusMessage,
        "setErrorMessage": setErrorMessage
    }

})();
