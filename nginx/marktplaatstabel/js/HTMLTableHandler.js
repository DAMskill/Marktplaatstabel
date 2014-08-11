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

	var record = null;
        var checkIfReady = null;
	var checkInterval = null;
        var nrOfCheckedRecords = null;
        var recordsQueue=[];

	function displayNrOfCheckedRecords() {

		if (nrOfCheckedRecords>0) {
			$("#placeAllCheckedAds").show();
			$("#submitAllChecked").val("Plaats "+nrOfCheckedRecords+" advertentie(s)");
		}
		else {
			$("#placeAllCheckedAds").hide();
		}
	}

	function onClickRecord(link) {

		EventHandler.clearAllIntervals();

		link = link.parentNode;
		var linkSplit = link.id.split("-");
		var recordToOpen = parseInt(linkSplit[1]);

		window.scrollTo(0,0);

		$("table.ExcelTable2007 > tbody > tr td.highlight").removeClass("active");
		$(link).find("td.highlight").addClass("active");

		// Save selection for error recovery
		localStorage.lastRowClicked = recordToOpen+1;

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
                    // Onload iframe calls form filler
                    backLink.click();
                }
                else {
                    FormFiller.fillForm(record);
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
                //myframeWindow.AURORA.Pages.syi.childViews.descriptionEditor.init();
                //myframeWindow.AURORA.Pages.syi.childViews.descriptionEditor._initValidation();
                myframeWindow.AURORA.Pages.syi.childViews.form.beforeSubmit();
                if (!myframeWindow.AURORA.Pages.syi.childViews.form.noErrorsFound()) {
                    FormFiller.setErrorMessage("Formulier validatie mislukt");
                    return false;
                }
                return true;
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

		$("#submitAllChecked").click(function() {
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
			displayNrOfCheckedRecords();
		});

		$("input[type='checkbox'].selectable").change(function() {
			if ($(this).is(":checked")) ++nrOfCheckedRecords;
			else --nrOfCheckedRecords;
			displayNrOfCheckedRecords();
		});

		/* Error recovery */
		var rowToClickOn = getErrorRecoveryRowToClickOn();
		if (rowToClickOn!==null)
			$("table.ExcelTable2007 > tbody > tr").eq(rowToClickOn).find("td:eq(2)").click();

		var recordsQueue = getErrorRecoveryRecordsQueue();
		if (recordsQueue!==null)
			processRecordsQueue(recordsQueue);
	}

        function clickOnElement(element) {
	   	var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		element.dispatchEvent(evt);
    	}

	function processRecordsQueue(recordsQueue) {

		var condition = null;
		var action = null;
		var _recordsQueueIntervalCounter = 0;

		condition = function() { 
                    if ($("table.ExcelTable2007 > tbody > tr").eq(recordsQueue[0]+1).find("td:eq(2)").length>0) return true; 
                }
		action = function() { 
                    $("table.ExcelTable2007 > tbody > tr").eq(recordsQueue[0]+1).find("td:eq(2)").click(); 
                }
		EventHandler.waitForConditionAndExecute("wachten op Excel tabel", condition, action);

		checkInterval = setInterval(function() {

                    if (!EventHandler.isActive() && canValidateForm() && inScreen2()) {

                        clearInterval(checkInterval);

                        if (!validateForm()) {
                            $("table.ExcelTable2007 > tbody > tr").eq(recordsQueue[0]+1).addClass('error');
                            recordsQueue.shift();
                            if (recordsQueue.length>0) 
                                processRecordsQueue(recordsQueue);
                        }
                        else {
                            $("table.ExcelTable2007 > tbody > tr").eq(recordsQueue[0]+1).find("input:checkbox").click();
                            FormFiller.setStatusMessage("Excel record ingevuld");
                            // Click on place advertisement button
                            var pushButton = $("#myframe").contents().find("#syi-place-ad-button")[0];
                            clickOnElement(pushButton);

                            recordsQueue.shift();
                            if (recordsQueue.length>0) 
                                processRecordsQueue(recordsQueue);
                        }
                    }
                    else {
                        if (++_recordsQueueIntervalCounter===15) {
                            EventHandler.clearAllIntervals();
                            localStorage.onErrorRecordsQueue = JSON.stringify(recordsQueue);
                            //location.reload(true);
                        }
                    }

		}, 1000);
	}

	function getErrorRecoveryRecordsQueue() {

		var recordsQueue = null;

		if (typeof localStorage.onErrorRecordsQueue !== 'undefined') {
			recordsQueue = JSON.parse(localStorage.onErrorRecordsQueue);
			delete localStorage.onErrorRecordsQueue;
		}
		return recordsQueue;
	}



	function getErrorRecoveryRowToClickOn() {

		var rowToClickOn = null;

		if (typeof localStorage.domChangeError !== 'undefined' && typeof localStorage.lastRowClicked !== 'undefined') {
			rowToClickOn = localStorage.lastRowClicked;
			delete localStorage.domChangeError;
		}
		return rowToClickOn;
	}

        function getRecord() {
            return record;
        }

        return {
            "validateForm": validateForm,
            "getRecord": getRecord,
            "onClickRecord": onClickRecord,
	    "processRecordsQueue": processRecordsQueue,
	    "getErrorRecoveryRecordsQueue": getErrorRecoveryRecordsQueue,
	    "getErrorRecoveryRowToClickOn": getErrorRecoveryRowToClickOn,
            "showExcelSheetInHtmlTable": showExcelSheetInHtmlTable
        }
})();

