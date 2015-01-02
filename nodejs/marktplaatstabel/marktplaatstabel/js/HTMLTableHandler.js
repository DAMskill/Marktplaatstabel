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

var HTMLTableHandler = (function() {

        "use strict";

        function HTMLTableHandler(recordReader) {

            this.recordErrors = recordReader.getErrors();

            if (this.recordErrors.length>0) {
                setMessage(this.recordErrors.join("<br/>"));
            }

            this.placeAddURI = "http://ssl.marktplaatstabel.services/syi/plaatsAdvertentie.html";
            this.nginxPlaceAdURI = "/ajaxPlaatsAdvertentie.html";
            this.recordReader = recordReader;
            this.record = null;
	    this.currentTableRow = null;
            this.eventHandler = null;
            this.refreshPlaceAdsButtonInterval = null;
            this.nrOfCheckedRecords = null;

            // Queue variables
            this.recordsQueue=[];
            this.totalNrOfAdsPlaced = 0;
            this.totalNrOfRecordsInQueue = 0;

            // Multimode record ready check interval
            this.checkIfRecordFromQueueIsDone = null;
            this.checkIfRecordFromQueueIsDoneInterval = 1000;
            // Number of checkIfRecordFromQueueIsDoneInterval executions
            // before aborting.
            this.maxRecordsQueueIntervalExecutions = 4*60; // (*1000 = 4 minutes)

            // Single mode check if record ready interval
            this.checkIfRecordReady = null;
            this.checkIfRecordReadyInterval = 1000;
            this.loadCurrentRecordFunction = null;
            this.contentWindow = null;
            this.formFiller = null; // FormFiller instance initialized in onClickRecord()
        }

	HTMLTableHandler.prototype.showExcelSheetInHtmlTable = function() {
            // Open selected file
            if (this.recordErrors.length===0) {
                buildExcelHtmlTable(this);
            }
        }

        HTMLTableHandler.prototype.loadCurrentRecord = function() {

            // Access to iframe with Marktplaats.nl
            this.contentWindow = document.getElementById("myframe").contentWindow;

            if (this.loadCurrentRecordFunction!==null)
                this.loadCurrentRecordFunction(this);
        }

        function setMessage(text) {
            $("div#messageLeftAboveTable").html(text);
        }

        function setStatusMessage(text) {
            $("#status").css("color","#21469e").html(text);
        }

        function setErrorMessage(text) {
            $("#status").css("color","#d01f3c").html(text);
        }

        function recordStatusHandler(statusMessage) {
            setStatusMessage(statusMessage);
        }

        function goToPlaceAddURL(_this) {
            try {
                if (_this.contentWindow.document.URL!==_this.placeAddURI) {
                    _this.contentWindow.location = _this.placeAddURI;
                    return true;
                }
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

	HTMLTableHandler.prototype.onClickRecord = function(element, isProcessingMultipleRecords) {

                // Check if on category selection page otherwise go there
                if (goToPlaceAddURL(this)===false) return false;

                if (this.eventHandler===null)
                    this.eventHandler = new EventHandler();

                this.formFiller = new FormFiller(this.eventHandler, recordStatusHandler);

		this.currentTableRow = element.parentNode;
		var link = element.parentNode;
		var linkSplit = link.id.split("-");
		var recordToOpen = parseInt(linkSplit[1]);

                // Status report is displayed after processing multiple records.
                $("div#statusReport").hide();

                if (typeof isProcessingMultipleRecords!=='undefined' && isProcessingMultipleRecords===true)
                {
                    this.loadCurrentRecordFunction = loadCurrentRecordMultiMode;
                }
                else {
                    clearFormFillerErrors();
                    this.loadCurrentRecordFunction = loadCurrentRecordSingleMode;
                }

                // Clear last status message
                setStatusMessage("");

		window.scrollTo(0,0);

                removeClassActiveFromColumns();
		$(link).find("td.highlight").addClass("active");

                this.record = this.recordReader.readRecord(recordToOpen);

                removeClassErrorFromRow(this);

                var backLink = $("#myframe").contents().find("a.backlink > span");

                if (backLink.length > 0) {
                    // Onload iframe calls loadCurrentRecord()
                    backLink.click();
                }
                else {
                    this.loadCurrentRecord();
                }
	}

	function refreshPlaceAdsButton(_this) {

		if (_this.nrOfCheckedRecords>0) {
			$("div#placeAllCheckedAds").show();
                        $("div#notLoggedInWarning").hide();
			$("input#submitAllCheckedButton").val("Plaats "+_this.nrOfCheckedRecords+" advertentie(s)");

                        if (!CookieHandler.isUserLoggedIn()) {
                            $("input#submitAllCheckedButton").prop("disabled", true);
                            $("div#notLoggedInWarning").show();
                        }
                        else {
                            $("input#submitAllCheckedButton").prop("disabled", false);
                        }
		}
		else {
			$("#placeAllCheckedAds").hide();
		}
	}

        function removeClassActiveFromColumns() {
		$("table.ExcelTable2007 > tbody > tr td.highlight").removeClass("active");
        }

        function clearFormFillerErrors() {
                $("div#errorBox").hide();
                $("ul.errorList").remove();
        }

        function printErrors(_this, extraErrorMessage) {

                var errors = _this.formFiller.getErrors();

                if (typeof extraErrorMessage!=="undefined" && extraErrorMessage!=="")
                    errors.push(extraErrorMessage);

                if (errors.length!==0) {


                    addClassErrorToRow(_this);
                    setErrorMessage("Formulier invullen/inzenden mislukt");

                    var rowNrInTable = $("table.ExcelTable2007 > tbody > tr").index(_this.currentTableRow);
                    var errorList = ("<ul class='errorList'><li>Record "+(rowNrInTable)+"<ul>");

                    $.each(errors, function(ix, error) {
                        errorList += "<li>";
                        errorList += error;
                        errorList += "</li>";
                    });

                    errorList += "</ul></li></ul>";

                    $("div#errorBox").append(errorList);
                    $("div#errorBox").show();
                }
        }

        function printResult(_this) {
            var result = "Aantal verwerkt: " + _this.totalNrOfRecordsInQueue + "<br>";
            result += "Aantal geplaatst: " + _this.totalNrOfAdsPlaced + "<br>";
            result += "Aantal mislukt: " + (_this.totalNrOfRecordsInQueue - _this.totalNrOfAdsPlaced);
            $("div#statusReport").show();
            $("div#result").html(result);
            document.location.hash="statusReport";
        }

        function submitFormWithAjax(_this) {

            var formWindow = document.getElementById("myframe").contentWindow;

            // Get description from tinymce iframe and copy it to textarea#description of the form
            var description = formWindow.$("iframe#description_ifr").contents().find("body#tinymce").html();
            formWindow.$("textarea#description").html(description);

            var form = formWindow.$("#syi-form");
            // Serialize all form data to post.
            var postData = form.serialize();

            var _formFiller = _this.formFiller;

            $.ajax(
            {
                url  : _this.nginxPlaceAdURI, // see also: constructor and nginx.conf
                type : "POST",
                data : postData,
                async: false, // Don't start new form until successful submission
                success:function(data, textStatus, jqXHR) 
                {
                    ++_this.totalNrOfAdsPlaced;
                },
                // Form submission might fail due to network or other errors.
                error: function(jqXHR, textStatus, errorThrown) 
                {
                    printErrors(_this, "Advertentie plaatsen mislukt");
                }
            });
        }

        function loadCurrentRecordMultiMode(_this) {

            var callback = null;

            clearIntervals(_this);

            callback = function() {
                multiModeCallback(_this);
            }

            if (_this.record !== null) {

                // Marktplaats.nl JS code replaces the value of each input element
                // with the value of attribute data-placeholder if it exists. This
                // simulates the HTML5 placeholder attribute. Clear these values
                // before filling out the form to prevent submitting the help text
                // of these input fields (e.g. microTipText contains the text
                // 'Bijvoorbeeld AANBIEDING' as the placeholder).
                _this.contentWindow.$("#syi-form :input[data-placeholder]").val('');

                // Markplaats.nl is inside an iFrame (contentWindow).
                _this.formFiller.fillForm(_this.contentWindow, _this.record, callback);
            }
        }

        function multiModeCallback(_this) {

            var _recordsQueueIntervalCounter = 0;

            _this.checkIfRecordFromQueueIsDone = setInterval(function() {

                if (++_recordsQueueIntervalCounter >= _this.maxRecordsQueueIntervalExecutions) {
                    clearIntervals(_this);
                    _this.record=null;
                    printErrors(_this, "Timeout: formulier invullen heeft te lang geduurd");
                    processNextInQueue(_this);
                }
                else {

                    if (!_this.formFiller.isActive()) {

                        if (!_this.formFiller.inFinalForm()) {
                            if (_this.formFiller.hasErrors()) {
                                clearIntervals(_this);
                                _this.record=null;
                                printErrors(_this);
                            }
                        }
                        else {
                           
                            if (canValidateForm(_this)) {

                                clearIntervals(_this);
                                _this.record=null;
                                var isInvalidForm = !validateForm(_this);

                                if (_this.formFiller.hasErrors() || isInvalidForm) {
                                    printErrors(_this, isInvalidForm ? "Formulier validatie mislukt" : "");
                                }
                                else {
                                    setStatusMessage("Excel record succesvol ingevuld");

                                    // Deselect record checkbox
                                    $("table.ExcelTable2007 > tbody > tr").eq(_this.recordsQueue[0]).find("input:checkbox").click();

                                    // Submit form with ajax to prevent a redirect and
                                    // opening a new window for every advertisement.
                                    submitFormWithAjax(_this);
                                }
                            }
                        }

                        // Form was either submitted or cancelled. Continue with next.
                        processNextInQueue(_this);
                    }
                }
            }, _this.checkIfRecordFromQueueIsDoneInterval);
        }

        function loadCurrentRecordSingleMode(_this) {

                var callback = null;

                clearIntervals(_this);

                callback = function() {
                    singleModeCallback(_this);
                }

                if (_this.record !== null) {
                    _this.formFiller.fillForm(_this.contentWindow, _this.record, callback);
                }
        }

        function singleModeCallback(_this) {

            // Check if eventHandler.waitForConditionAndExecute() is active
            _this.checkIfRecordReady = setInterval(function() {

                if (_this.formFiller.isActive()===false) {

                    clearInterval(_this.checkIfRecordReady);

                    if (_this.formFiller.hasErrors()) {
                        printErrors(_this);
                    }
                    else {
                        if (_this.formFiller.inFinalForm()===true) {
                            _this.record = null;
                            setStatusMessage("Excel record succesvol ingevuld");
                        }
                    }
                }

            }, _this.checkIfRecordReadyInterval);
        }

        function canValidateForm(_this) {
            try {
                var childViews = _this.contentWindow.AURORA.Pages.syi.childViews;

                if (typeof childViews.descriptionEditor._initValidation === 'undefined' || 
                    typeof childViews.form.beforeSubmit === 'undefined' ||
                    typeof childViews.descriptionEditor.rteInstance === 'undefined'
                    )
                {
                    return false;
                }
            }
            catch(error) {
                return false;
            }
            return true;
        }

        function validateForm(_this) {
                _this.contentWindow.AURORA.Pages.syi.childViews.form.beforeSubmit();
                if (!_this.contentWindow.AURORA.Pages.syi.childViews.form.noErrorsFound()) {
                    return false;
                }
                return true;
        }

	function buildExcelHtmlTable(_this) {

		var record = _this.recordReader.readRecord(0);
		setMessage("Aantal records: "+(parseInt(record.nrofrows)));

		var i = 0;
		for (; i < record.nrofrows; i++) {

			var category = "";
			var title = "";

			record = _this.recordReader.readRecord(i);

			if (typeof record.category2 !== 'undefined')
				category = record.category2;
			else continue;

			if (typeof record.title !== 'undefined')
				title = record.title;

			var str = "<tr id='rec-"+i+"'>" +
				  "<td><input id='checkbox-"+i+"' class='selectable' type='checkbox'></td>"+
				  "<td class='heading hover'   onclick='tableHandler.onClickRecord(this);return false;'>"+(i+2)+"</td>" +
				  "<td class='highlight hover' onclick='tableHandler.onClickRecord(this);return false;'>"+title+"</td>" +
				  "<td class='highlight hover' onclick='tableHandler.onClickRecord(this);return false;'>"+category+"</td>" +
				  "</tr>";

			$("table.ExcelTable2007 > tbody").append(str);
			$("table.ExcelTable2007 > tbody > tr > td.hover").hover(excelTable2007MouseEnter, excelTable2007MouseLeave);
		}

		// Unhide excel table
		$("div#tableBox").css("display", "block");

		$("input#submitAllCheckedButton").click(function() {
                        // If user clicked before refreshPlaceAdsButtonInterval() fired
                        if (!CookieHandler.isUserLoggedIn()) {
                            refreshPlaceAdsButton(_this);
                            return;
                        }
                        clearFormFillerErrors();
			_this.recordsQueue=[];
			$("input[type='checkbox'].selectable:checked").each(function(ix, checkboxElement) {
				var rowToClickOn = getRowToClickOnFromCheckbox(checkboxElement);
				_this.recordsQueue.push(rowToClickOn);
			});
                        _this.totalNrOfAdsPlaced=0;
                        _this.totalNrOfRecordsInQueue=_this.recordsQueue.length;
                        $("div#statusReport").hide();
			if (_this.recordsQueue.length>0)
				processRecordsQueue(_this);
		});

		$("#checkAll").click(function(ix, inputElement) {
			var count=0;
			$("table.ExcelTable2007 input[type='checkbox']:gt(1):enabled").prop("checked", function(i,val) {
				if (!val) ++count;
				return !val;
			});
			_this.nrOfCheckedRecords = count;
                        refreshPlaceAdsButton(_this);
		});

		$("input[type='checkbox'].selectable").change(function() {
			if ($(this).is(":checked")) ++_this.nrOfCheckedRecords;
			else --_this.nrOfCheckedRecords;
                        refreshPlaceAdsButton(_this);
		});

                // Check if logged in every 2 seconds and enable/disable place ads button.
                _this.refreshPlaceAdsButtonInterval = setInterval(function() {
                    refreshPlaceAdsButton(_this);
                }, 2000);
	}

        function clickOnElement(element) {
	   	var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		element.dispatchEvent(evt);
    	}

        function processNextInQueue(_this) {
                _this.recordsQueue.shift();

                if (_this.recordsQueue.length>0) {
                    processRecordsQueue(_this);
                }
                else {
                    printResult(_this);
                }

        }

        function clearIntervals(_this) {
		_this.formFiller.clearAllIntervals();
                clearInterval(_this.checkIfRecordFromQueueIsDone); // multiModeCallback
                clearInterval(_this.checkIfRecordReady); // singleModeCallback
        }

        function addClassErrorToRow(_this) {
            removeClassActiveFromColumns();
            $(_this.currentTableRow).addClass('error');
        }

        function removeClassErrorFromRow(_this) {
            $(_this.currentTableRow).removeClass('error');
        }

	function processRecordsQueue(_this) {
                // Call onClickRecord() with table row containing current record from queue
                var element = $("table.ExcelTable2007 > tbody > tr").eq(_this.recordsQueue[0]).find("td:eq(2)")[0];
                _this.onClickRecord.call(_this, element, true);
	}

	function getRowToClickOnFromCheckbox(checkboxElement) {
            var tableRowElement = $(checkboxElement).parent().parent()[0];
	    var rowToClickOn = $("table.ExcelTable2007 > tbody > tr").index(tableRowElement);
	    return rowToClickOn;
	}

        return HTMLTableHandler;

})();
