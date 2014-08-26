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

	var record = null;
        var refreshPlaceAdsButtonInterval = null;
        var nrOfCheckedRecords = null;
        var recordsQueue=[];

	var checkIfRecordFromQueueIsDone = null;
	var checkIfRecordFromQueueIsDoneInterval = 1000;

        // Number of checkIfRecordFromQueueIsDoneInterval executions
        // before aborting.
        var maxRecordsQueueIntervalCounter = 4*60; // (*1000 = 4 minutes)

        var checkIfRecordReady = null;
        var checkIfRecordReadyInterval = 1000;


	function refreshPlaceAdsButton() {

		if (nrOfCheckedRecords>0) {
			$("div#placeAllCheckedAds").show();
                        $("div#notLoggedInWarning").hide();
			$("input#submitAllCheckedButton").val("Plaats "+nrOfCheckedRecords+" advertentie(s)");

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

	function onClickRecord(link) {

                // Clear last message
                FormFiller.setStatusMessage("");

		EventHandler.clearAllIntervals();

		link = link.parentNode;
		var linkSplit = link.id.split("-");
		var recordToOpen = parseInt(linkSplit[1]);

		window.scrollTo(0,0);

                removeClassActiveFromColumns();
		$(link).find("td.highlight").addClass("active");

		try {
                    record = Excel.readRecord(recordToOpen);
		}
		catch (error) {
                    if (error.number===-2146827864 /*Object required*/) {
                        Excel.openExcelSheet();
                        record = Excel.readRecord(recordToOpen);
                    }
                    else throw error;
		}

                var backLink = $("#myframe").contents().find("a.backlink > span");

                if (backLink.length > 0) {
                    // Onload iframe calls loadCurrentRecord()
                    backLink.click();
                }
                else {
                    loadCurrentRecord();
                }
	}

        function loadCurrentRecord() {

                clearInterval(checkIfRecordReady);

                if (record !== null) {

                    FormFiller.fillForm(record);

                    // Check if EventHandler.waitForConditionAndExecute() is active
                    checkIfRecordReady = setInterval(function() {
                        if (EventHandler.isActive()===false) {
                            FormFiller.setStatusMessage("Excel record succesvol ingevuld");
                            clearInterval(checkIfRecordReady);
                        }
                    }, checkIfRecordReadyInterval);
                }
        }

        function inScreen2() {
            var myframeWindow = document.getElementById("myframe").contentWindow;
            if (myframeWindow.document.URL.match("https://localhost/syi/.*/.*/plaatsAdvertentie")!==null)
            {
                return true;
            }
            return false;
        }

        function canValidateForm() {
            try {
                var myframeWindow = document.getElementById("myframe").contentWindow;
                var childViews = myframeWindow.AURORA.Pages.syi.childViews;

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
                var myframeWindow = document.getElementById("myframe").contentWindow;
                myframeWindow.AURORA.Pages.syi.childViews.form.beforeSubmit();
                if (!myframeWindow.AURORA.Pages.syi.childViews.form.noErrorsFound()) {
                    return false;
                }
                return true;
        }

        function userIsLoggedIn() {
                var loggedInCookie = CookieHandler.getCookie("LoggedIn");
                return loggedInCookie==="true";
        }

	function showExcelSheetInHtmlTable() {

		$(window).on('beforeunload', function(){ 
			Excel.closeExcelSheet();
		});

		var record = Excel.readRecord(1);
		$("div#nrofrecords").append("Aantal records: "+(parseInt(record.nrofrows)-1)+"<b>");

		var i = 1;
		for (; i < record.nrofrows; i++) {

			var category = "";
			var title = "";

			if (i>1) record = Excel.readRecord(i);

			if (typeof record.category2 !== 'undefined')
				category = record.category2;
			else continue;

			if (typeof record.title !== 'undefined')
				title = record.title;

			var str = "<tr id='rec-"+i+"'>" +
				  "<td><input id='checkbox-"+i+"' class='selectable' type='checkbox'></td>"+
				  "<td class='heading hover'   onclick='HTMLTableHandler.onClickRecord(this);return false;'>"+(i+1)+"</td>" +
				  "<td class='highlight hover' onclick='HTMLTableHandler.onClickRecord(this);return false;'>"+title+"</td>" +
				  "<td class='highlight hover' onclick='HTMLTableHandler.onClickRecord(this);return false;'>"+category+"</td>" +
				  "</tr>";

			$("table.ExcelTable2007 > tbody").append(str);
			$("table.ExcelTable2007 > tbody > tr > td.hover").hover(excelTable2007MouseEnter, excelTable2007MouseLeave);
		}

		// Unhide excel table
		$("div#tableBox").css("display", "block");

		$("input#submitAllCheckedButton").click(function() {
                        // If user clicked before refreshPlaceAdsButtonInterval() fired
                        if (!userIsLoggedIn()) {
                            refreshPlaceAdsButton();
                            return;
                        }
			recordsQueue=[];
			$("input[type='checkbox'].selectable:checked").each(function(ix, element) {
                                var id = $(element).parent().parent().prop("id");
				/* Strip 'rec-' off */
				var rowToClickOn = parseInt(id.substring(4,id.length));
				recordsQueue.push(rowToClickOn);
			});
                        processRecordsQueue(recordsQueue);

		});

		$("#checkAll").click(function(ix, inputElement) {
			var count=0;
			$("table.ExcelTable2007 input[type='checkbox']:gt(1):enabled").prop("checked", function(i,val) {
				if (!val) ++count;
				return !val;
			});
			nrOfCheckedRecords = count;
			refreshPlaceAdsButton();
		});

		$("input[type='checkbox'].selectable").change(function() {
			if ($(this).is(":checked")) ++nrOfCheckedRecords;
			else --nrOfCheckedRecords;
			refreshPlaceAdsButton();
		});

                // Check if logged in every 2 seconds and enable/disable place ads button.
                refreshPlaceAdsButtonInterval = setInterval(function() {
                    HTMLTableHandler.refreshPlaceAdsButton();
                }, 2000);
	}

        function clickOnElement(element) {
	   	var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		element.dispatchEvent(evt);
    	}

        function processNextInQueue() {
                recordsQueue.shift();
                if (recordsQueue.length>0) 
                    processRecordsQueue(recordsQueue);
        }

        function clearIntervals() {
                clearInterval(checkIfRecordFromQueueIsDone);
                clearInterval(checkIfRecordReady); // loadCurrentRecord()
        }

        function addClassErrorToRow(rowNr) {
            removeClassActiveFromColumns();
            $("table.ExcelTable2007 > tbody > tr").eq(rowNr).addClass('error');
        }

	function processRecordsQueue(recordsQueue) {

		var condition = null;
		var action = null;
		var _recordsQueueIntervalCounter = 0;

                // Call onClickRecord()
                $("table.ExcelTable2007 > tbody > tr").eq(recordsQueue[0]+1).find("td:eq(2)").click(); 

		checkIfRecordFromQueueIsDone = setInterval(function() {

                    if (++_recordsQueueIntervalCounter >= maxRecordsQueueIntervalCounter) {
                        clearIntervals();
                        EventHandler.clearAllIntervals();
                        FormFiller.setColorStatusMessageRed();
                        addClassErrorToRow(recordsQueue[0]+1);
                        processNextInQueue();
                    }
                    else {
                        if (!EventHandler.isActive() && canValidateForm() && inScreen2()) {

                            clearIntervals();

                            if (!validateForm()) {
                                FormFiller.setErrorMessage("Formulier validatie mislukt");
                                addClassErrorToRow(recordsQueue[0]+1);
                            }
                            else {
                                FormFiller.setStatusMessage("Excel record succesvol ingevuld");
                                // Deselect record checkbox
                                $("table.ExcelTable2007 > tbody > tr").eq(recordsQueue[0]+1).find("input:checkbox").click();

                                // Click on place advertisement button
                                var pushButton = $("#myframe").contents().find("#syi-place-ad-button")[0];
                                clickOnElement(pushButton);
                            }
                            processNextInQueue();
                        }
                    }
		}, checkIfRecordFromQueueIsDoneInterval);
	}

        return {
            "validateForm": validateForm,
            "loadCurrentRecord": loadCurrentRecord,
            "onClickRecord": onClickRecord,
	    "processRecordsQueue": processRecordsQueue,
            "showExcelSheetInHtmlTable": showExcelSheetInHtmlTable,
            "refreshPlaceAdsButton": refreshPlaceAdsButton
        }
})();
