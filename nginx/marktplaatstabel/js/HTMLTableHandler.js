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

        function HTMLTableHandler(excelReader) {

            this.excelReader = excelReader;
            this.record = null;
            this.eventHandler = null;
            this.refreshPlaceAdsButtonInterval = null;
            this.nrOfCheckedRecords = null;

            // Queue variables
            this.recordsQueue=[];
            this.totalNrOfAdsPlaced = 0;
            this.totalNrOfRecordsInQueue = 0;
            this.totalNrOfRecordsSubmitted = 0;
            this.totalNrOfRecordsSubmittedFinished = 0;

            this.checkIfRecordFromQueueIsDone = null;
            this.checkIfRecordFromQueueIsDoneInterval = 1000;
            // Number of checkIfRecordFromQueueIsDoneInterval executions
            // before aborting.
            this.maxRecordsQueueIntervalExecutions = 4*60; // (*1000 = 4 minutes)

            this.checkIfRecordReady = null;
            this.checkIfRecordReadyInterval = 1000;
            this.loadCurrentRecordFunction = null;
            this.currentFormWindow = null;
            this.formFiller = null; // FormFiller instance initialized in onClickRecord()
        }

	HTMLTableHandler.prototype.showExcelSheetInHtmlTable = function() {
            var _this = this;
            // Open file selected in Responsive File Manager.
            // If successful call buildExcelHtmlTable().
            this.excelReader.tryToOpenFileUntilSuccesful(function() {
                buildExcelHtmlTable.call(_this);
            });
        }

        HTMLTableHandler.prototype.loadCurrentRecord = function() {

            // Access to iframe with Marktplaats.nl
            this.currentFormWindow = document.getElementById("myframe").contentWindow;

            if (this.loadCurrentRecordFunction!==null)
                this.loadCurrentRecordFunction.call(this);
        }

	HTMLTableHandler.prototype.onClickRecord = function(element, processingMultipleRecords) {

                this.eventHandler = new EventHandler();

                // Initialize FormFiller with reference to Marktplaats.nl's jQuery object.
                // Markplaats.nl is inside an iFrame that is showing Marktplaats.nl through localhost proxy.
                this.formFiller = new FormFiller(this.eventHandler);
		this.eventHandler.clearAllIntervals();

		var link = element.parentNode;
		var linkSplit = link.id.split("-");
		var recordToOpen = parseInt(linkSplit[1]);

                // Status report is displayed after processing multiple records.
                $("div#statusReport").hide();

                if (typeof processingMultipleRecords!=='undefined' && processingMultipleRecords===true)
                {
                    this.loadCurrentRecordFunction = loadCurrentRecordMultiMode;
                }
                else {
                    clearFormFillerErrors();
                    this.loadCurrentRecordFunction = loadCurrentRecordSingleMode;
                }

                // Clear last status message
                this.formFiller.setStatusMessage("");

		window.scrollTo(0,0);

                removeClassActiveFromColumns();
		$(link).find("td.highlight").addClass("active");

		try {
                    this.record = this.excelReader.readRecord(recordToOpen);
		}
		catch (error) {
                    if (error.number===-2146827864 /*Object required*/) {
                        this.excelReader.openExcelSheet();
                        this.record = this.excelReader.readRecord(recordToOpen);
                    }
                    else throw error;
		}

                var backLink = $("#myframe").contents().find("a.backlink > span");

                if (backLink.length > 0) {
                    // Onload iframe calls loadCurrentRecord()
                    backLink.click();
                }
                else {
                    this.loadCurrentRecord();
                }
	}

	function refreshPlaceAdsButton() {

		if (this.nrOfCheckedRecords>0) {
			$("div#placeAllCheckedAds").show();
                        $("div#notLoggedInWarning").hide();
			$("input#submitAllCheckedButton").val("Plaats "+this.nrOfCheckedRecords+" advertentie(s)");

                        if (!userIsLoggedIn()) {
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

        function printFormFillerErrors(errors) {

                if (errors.length!==0) {

                    this.formFiller.setErrorMessage("Formulier invullen mislukt");

                    var errorList = ("<ul class='errorList'><li>Record "+(parseInt(this.record.nr)+1)+"<ul>");

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

        function setResult() {
            if (this.totalNrOfRecordsSubmitted === this.totalNrOfRecordsSubmittedFinished &&
                    this.recordsQueue.length ===0 ) 
            {
                var result = "Aantal verwerkt: " + this.totalNrOfRecordsInQueue + "<br>";
                result += "Aantal geplaatst: " + this.totalNrOfAdsPlaced + "<br>";
                result += "Aantal mislukt: " + (this.totalNrOfRecordsInQueue - this.totalNrOfAdsPlaced);
                $("div#statusReport").show();
                $("div#result").html(result);
                document.location.hash="statusReport";
            }
        }

        function submitFormWithAjax() {

            var formWindow = document.getElementById("myframe").contentWindow;

            // Get description from tinymce iframe and copy it to textarea#description of the form
            var description = formWindow.$("iframe#description_ifr").contents().find("body#tinymce").html();
            formWindow.$("textarea#description").html(description);

            // Gather form URL and serialize all data to post.
            var form = formWindow.$("#syi-form");
            var postData = form.serialize();
            var formURL = form.attr("action");

            ++this.totalNrOfRecordsSubmitted;

            var _this = this;
            $.ajax(
            {
                url : formURL,
                type: "POST",
                data : postData,
                success:function(data, textStatus, jqXHR) 
                {
                    ++_this.totalNrOfRecordsSubmittedFinished;

                    // If ad description is found in HTML string
                    if (data.indexOf(description)) {
                        ++_this.totalNrOfAdsPlaced;
                    }
                    setResult.call(_this);
                },
                error: function(jqXHR, textStatus, errorThrown) 
                {
                    ++_this.totalNrOfRecordsSubmittedFinished;
                    setResult.call(_this);
                }
            });
        }

        function loadCurrentRecordMultiMode() {

            var _this = this;
            var callback = null;

            clearIntervals.call(_this);

            if (inScreen2.call(this)===true) {
                callback = function() {
                    multiModeCallback.call(_this);
                }
            }

            if (this.record !== null) {
                this.formFiller.fillForm(this.currentFormWindow, this.record, callback);
            }
        }

        function multiModeCallback() {

            var _recordsQueueIntervalCounter = 0;
            var _this = this;

            this.checkIfRecordFromQueueIsDone = setInterval(function() {

                if (++_recordsQueueIntervalCounter >= _this.maxRecordsQueueIntervalExecutions) {
                    clearIntervals.call(_this);
                    _this.eventHandler.clearAllIntervals();
                    _this.formFiller.setColorStatusMessageRed();
                    addClassErrorToRow(_this.recordsQueue[0]+1);
                    processNextInQueue.call(_this);
                }
                else {

                    if (!_this.eventHandler.isActive() && inScreen2.call(_this) && canValidateForm.call(_this) ) {

                        clearIntervals.call(_this);

                        if (!validateForm.call(_this)) {
                            var errorMessage = "Formulier validatie mislukt";
                            _this.formFiller.setErrorMessage(errorMessage);
                            var errors = _this.formFiller.getErrors();
                            errors.push(errorMessage);
                            addClassErrorToRow(_this.recordsQueue[0]+1);
                            printFormFillerErrors.call(_this, errors);
                        }
                        else {

                            var errors = _this.formFiller.getErrors();
                            if (errors.length!=0) {
                                printFormFillerErrors.call(_this, errors);
                                addClassErrorToRow(_this.recordsQueue[0]+1);
                            }
                            else {
                                _this.formFiller.setStatusMessage("Excel record succesvol ingevuld");

                                // Deselect record checkbox
                                $("table.ExcelTable2007 > tbody > tr").eq(_this.recordsQueue[0]+1).find("input:checkbox").click();

                                // Submit form with ajax to prevent a redirect and
                                // opening a new window for every advertisement.
                                submitFormWithAjax.call(_this);
                            }
                        }
                        processNextInQueue.call(_this);
                    }
                }
            }, this.checkIfRecordFromQueueIsDoneInterval);
        }

        function loadCurrentRecordSingleMode() {

                var _this = this;
                var callback = null;

                clearIntervals.call(this);

                if (inScreen2.call(this)===true) {
                    callback = function() {
                        singleModeCallback.call(_this);
                    }
                }

                if (this.record !== null) {
                    this.formFiller.fillForm(this.currentFormWindow, this.record, callback);
                }
        }

        function singleModeCallback() {

            var _this = this;
            // Check if eventHandler.waitForConditionAndExecute() is active
            this.checkIfRecordReady = setInterval(function() {

                if (_this.formFiller.isActive()===false) {
                    clearInterval(_this.checkIfRecordReady);

                    var errors = _this.formFiller.getErrors();
                    if (errors.length!=0) {
                        addClassErrorToRow(_this.record.nr+1);
                        printFormFillerErrors.call(_this, errors);
                    }
                    else {
                        _this.formFiller.setStatusMessage("Excel record succesvol ingevuld");
                    }
                }

            }, this.checkIfRecordReadyInterval);
        }


        function inScreen2() {
            if (this.currentFormWindow.document.URL.match("https://localhost/syi/.*/.*/plaatsAdvertentie")!==null)
            {
                return true;
            }
            return false;
        }

        function canValidateForm() {
            try {
                var childViews = this.currentFormWindow.AURORA.Pages.syi.childViews;

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

        function validateForm() {
                this.currentFormWindow.AURORA.Pages.syi.childViews.form.beforeSubmit();
                if (!this.currentFormWindow.AURORA.Pages.syi.childViews.form.noErrorsFound()) {
                    return false;
                }
                return true;
        }

        function userIsLoggedIn() {
                var loggedInCookie = CookieHandler.getCookie("LoggedIn");
                return loggedInCookie==="true";
        }

	function buildExcelHtmlTable() {

                var _this = this;
		$(window).on('beforeunload', function(){ 
			_this.excelReader.closeExcelSheet();
		});

		var record = this.excelReader.readRecord(1);
		$("div#nrofrecords").append("Aantal records: "+(parseInt(record.nrofrows)-1)+"<b>");

		var i = 1;
		for (; i < record.nrofrows; i++) {

			var category = "";
			var title = "";

			if (i>1) record = this.excelReader.readRecord(i);

			if (typeof record.category2 !== 'undefined')
				category = record.category2;
			else continue;

			if (typeof record.title !== 'undefined')
				title = record.title;

			var str = "<tr id='rec-"+i+"'>" +
				  "<td><input id='checkbox-"+i+"' class='selectable' type='checkbox'></td>"+
				  "<td class='heading hover'   onclick='tableHandler.onClickRecord(this);return false;'>"+(i+1)+"</td>" +
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
                        if (!userIsLoggedIn()) {
                            refreshPlaceAdsButton.call(_this);
                            return;
                        }
                        clearFormFillerErrors();
			_this.recordsQueue=[];
			$("input[type='checkbox'].selectable:checked").each(function(ix, element) {
                                var id = $(element).parent().parent().prop("id");
				/* Strip 'rec-' off */
				var rowToClickOn = parseInt(id.substring(4,id.length));
				_this.recordsQueue.push(rowToClickOn);
			});
                        _this.totalNrOfAdsPlaced=0;
                        _this.totalNrOfRecordsSubmitted=0;
                        _this.totalNrOfRecordsSubmittedFinished=0;
                        _this.totalNrOfRecordsInQueue=_this.recordsQueue.length;
                        $("div#statusReport").hide();
                        processRecordsQueue.call(_this, _this.recordsQueue);
		});

		$("#checkAll").click(function(ix, inputElement) {
			var count=0;
			$("table.ExcelTable2007 input[type='checkbox']:gt(1):enabled").prop("checked", function(i,val) {
				if (!val) ++count;
				return !val;
			});
			_this.nrOfCheckedRecords = count;
                        refreshPlaceAdsButton.call(_this);
		});

		$("input[type='checkbox'].selectable").change(function() {
			if ($(this).is(":checked")) ++_this.nrOfCheckedRecords;
			else --_this.nrOfCheckedRecords;
                        refreshPlaceAdsButton.call(_this);
		});

                // Check if logged in every 2 seconds and enable/disable place ads button.
                this.refreshPlaceAdsButtonInterval = setInterval(function() {
                    refreshPlaceAdsButton.call(_this);
                }, 2000);
	}

        function clickOnElement(element) {
	   	var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		element.dispatchEvent(evt);
    	}

        function processNextInQueue() {
                this.recordsQueue.shift();

                if (this.recordsQueue.length>0) {
                    processRecordsQueue.call(this);
                }

        }

        function clearIntervals() {
                clearInterval(this.checkIfRecordFromQueueIsDone);
                clearInterval(this.checkIfRecordReady); // started in loadCurrentRecord()
        }

        function addClassErrorToRow(rowNr) {
            removeClassActiveFromColumns();
            $("table.ExcelTable2007 > tbody > tr").eq(rowNr).addClass('error');
        }

	function processRecordsQueue() {
                // Call onClickRecord() with table row containing current record from queue
                var element = $("table.ExcelTable2007 > tbody > tr").eq(this.recordsQueue[0]+1).find("td:eq(2)")[0];
                this.onClickRecord.call(this, element, true);
	}

        return HTMLTableHandler;

})();
