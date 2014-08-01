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

var cookieHandler = (function() {

    "use strict";
 
    function setCookie(name,value,days) {

	if (days) {
	    var date = new Date();
	    date.setTime(date.getTime()+(days*24*60*60*1000));
	    var expirationDate = "; expires="+date.toGMTString();
	}
	else return false;

	document.cookie = name+"="+value+expirationDate+"; path=/";
	return true;
    }

    function getCookie(name) {
	var nameEQ = name + "=";
	var ca = document.cookie.split(';');
	for(var i=0;i < ca.length;i++) {
	    var c = ca[i];
	    while (c.charAt(0)==' ') c = c.substring(1,c.length);
	    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
	}
	return null;
    }

    function delCookie(name) {
	var expirationDate = "; expires=Thu, 01-Jan-1970 00:00:01 GMT";
	document.cookie = name+"="+expirationDate+"; path=/";
    }
    
    return {
	setCookie: setCookie,
	getCookie: getCookie,
	delCookie: delCookie
    }

})();

var Marktplaatstabel = (function() {

	"use strict";

	var MAX_NR_OF_PICTURES = 20;
	var COLUMN_HEADERS = [
		'Rubriek',
		'Titel',
		'Keuzelijsten',
		'Aankruisvakjes',
		'Advertentie',
		'Vraagprijs',
		'Prijssoort',
		'Paypal',
		'Overige invoervelden',
		'Voeg foto toe'
	];

	var excelApp = null;
	var excelWorkbook = null;
	var excelSheet = null;

	var _i = 0;
	var _actionSuccessCounter = 0;
	var _domChangeTimer = [];
	var _domChangeDelay = 200;
	var _checkIfReady = null

	var record = null;
	var columnPositions = null;

	jQuery.expr[':'].Contains = function(a,i,m){
	     	return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
	};

	function checkRequiredColumns() {
		var found = null;
		$.each(COLUMN_HEADERS, function (ix, colName) {
			found =	excelSheet.Rows(1).Find(colName);
			if (found===null) {
				throw new Error("Kolom <b>'"+colName+"'</b> niet gevonden in Excel sheet.")
			}
		});
	}

	/* Wait for DOM mutation and execute action function.
	 * Simulates: MutationObserver, DOMSubtreeModified
	 * http://www.w3.org/TR/DOM-Level-3-Events/#event-type-DOMSubtreeModified
	 * http://www.w3.org/TR/2014/WD-dom-20140710/#mutation-observers
	 **/
	function waitForConditionAndExecute(id, condition, action, text, time) {

	   if (_domChangeTimer[id]!=null) 
	       clearInterval(_domChangeTimer[id]);

	   _domChangeTimer[id] = setInterval(function() {

		setStatusMessage("Bezig met: "+text);
			if(condition()) {
				//console.log("after cond id:"+id+" "+text);
				if (action()!==false) {
					clearInterval(_domChangeTimer[id]);
					++_actionSuccessCounter;
				}
			}
		try {
		}
		catch(error) {
			// Clicking records too fast generating too many timers
			// will result in IE Permission denied errors.
			//console.log("Dom change error: "+error);
			localStorage.domChangeError = true;
			location.reload(true);
		}
	   }, time || _domChangeDelay);
	}

	function clearAllIntervals() {
		$.each(_domChangeTimer, function(ix,val) {
			clearInterval(_domChangeTimer[ix]);
		});
		_domChangeTimer = [];

		clearInterval(_checkIfReady);
		_checkIfReady = null;
	}

	function getColumnNumberByName(columnName) {
		var found = $.inArray(columnName, COLUMN_HEADERS);
		if (found===-1) {
			throw new Error("Softwarefout: kolom <b>'"+columnName+"'</b> is niet geregistreerd.")
		}
		else {
			return excelSheet.Rows(1).Find(columnName).Column;
		}
	}

	function getColumnPositions() {

		var columnPositions = {};
		columnPositions.categoryColumn      = getColumnNumberByName('Rubriek');
		columnPositions.titleColumn         = getColumnNumberByName('Titel');
		columnPositions.dropdownColumn      = getColumnNumberByName('Keuzelijsten');
		columnPositions.checkboxColumn      = getColumnNumberByName('Aankruisvakjes');
		columnPositions.advertisementColumn = getColumnNumberByName('Advertentie');
		columnPositions.priceColumn         = getColumnNumberByName('Vraagprijs');
		columnPositions.pricetypeColumn     = getColumnNumberByName('Prijssoort');
		columnPositions.paypalColumn        = getColumnNumberByName('Paypal');
		columnPositions.inputColumn         = getColumnNumberByName('Overige invoervelden');
		columnPositions.addPictureColumn    = getColumnNumberByName('Voeg foto toe');
		columnPositions.firstPictureColumn  = parseInt(columnPositions.addPictureColumn)+1;
		return columnPositions;
	}

	function readRecord(nr) {

		var record = {};

		/* Fetch column position */
		if (columnPositions === null)
			columnPositions = getColumnPositions();

		record.nrofrows      = excelSheet.Cells.Find("*", excelSheet.Cells(1), -4163, 1, 1, 2).Row

		record.category      = excelSheet.Cells(nr+1, columnPositions.categoryColumn).Value;
		record.dropdowns     = excelSheet.Cells(nr+1, columnPositions.dropdownColumn).Value;
		record.checkboxes    = excelSheet.Cells(nr+1, columnPositions.checkboxColumn).Value;
		record.inputfields   = excelSheet.Cells(nr+1, columnPositions.inputColumn).Value;
		record.pictures      = excelSheet.Cells(nr+1, columnPositions.firstPictureColumn).Value;

		record.title         = excelSheet.Cells(nr+1, columnPositions.titleColumn).Value;
		record.advertisement = excelSheet.Cells(nr+1, columnPositions.advertisementColumn).Value;
		record.price         = excelSheet.Cells(nr+1, columnPositions.priceColumn).Value;
		record.pricetype     = excelSheet.Cells(nr+1, columnPositions.pricetypeColumn).Value;
		record.paypal        = excelSheet.Cells(nr+1, columnPositions.paypalColumn).Value;
                                                                      
		var pictureIndex = columnPositions.firstPictureColumn+1;
		while (typeof excelSheet.Cells(nr+1, pictureIndex).Value !== 'undefined' && pictureIndex < (MAX_NR_OF_PICTURES + parseInt(columnPositions.firstPictureColumn))) {
			record.pictures += ';' + excelSheet.Cells(nr+1,pictureIndex++).Value;
		}

		if (typeof record.category !== 'undefined') {
			record.category = record.category.split(";");
			$.each(record.category, function(ix,val) {
				val=$.trim(val);
				if (val!=='') {
					record.category[ix]=val;
				}
				else {
					/* Remove empty elements */
					record.category.splice(ix,1);
				}
			});
		}

		if (typeof record.pictures !== 'undefined') {
			record.pictures = record.pictures.split(";");
			$.each(record.pictures, function(ix,val) {
				val=$.trim(val);
				if (val!=='') {
					record.pictures[ix]=val;
				}
			});
		}

		function parseStringTo2DArray(arrayAsString) {

			var splitArray = arrayAsString.split(";");
			var newArray = new Array();
			$.each(splitArray, function(ix,val) {
				if (typeof val ==='undefined' || val.indexOf(":")===-1) {
					return;
				}
				newArray[ix]=val.split(":");
				// Remove leading and trailing spaces from result values of split
				$.each(newArray[ix], function(y,val) {
				       newArray[ix][y] = $.trim(newArray[ix][y]);
				});
			});
			return newArray;
		}

		function parseStringToArray(arrayAsString) {

			var splitArray = arrayAsString.split(",");
			var newArray = new Array();
			$.each(splitArray, function(ix,val) {
				if (typeof val ==='') {
					return;
				}
				newArray[ix]=$.trim(val);
			});
			return newArray;
		}

		if (typeof record.dropdowns !== 'undefined') {
			record.dropdowns = parseStringTo2DArray(record.dropdowns);
		}

		if (typeof record.checkboxes !== 'undefined')
			record.checkboxes = parseStringToArray(record.checkboxes);

		if (typeof record.paypal !== 'undefined')
			record.paypal = record.paypal.toLowerCase();

		if (typeof record.inputfields !== 'undefined') {
			record.inputfields = parseStringTo2DArray(record.inputfields);
		}

		return record;
	}

	function setImage(ix, imgData) {
		var imgUploadContainer = $("#myframe").contents().find("div.uploaders div.uploader-container").eq(ix);
		var imageUrl = (imgUploadContainer.hasClass('large') ? imgData.largeImageUrl : imgData.imageUrl);

		imgUploadContainer.find("> input[name='images.ids']").val(imgData.id); 
		imgUploadContainer.find("div.thumb").append("<img src='"+imageUrl+"'>").css({"width":"100%","height":"100%"}); 
		imgUploadContainer.find("div.large-photo-subtext").hide();
		imgUploadContainer.find("img.image-upload-logo").hide();
		imgUploadContainer.find("span.uploader-label").hide();
		imgUploadContainer.removeClass("empty").addClass("complete");
	}

	function isScreenAfterCategorySelectionActive() { 
		return $("#myframe").contents().find("#syi-breadcrumbs-content").length > 0 
	}

        function getCategoryListItem (categoryListSelector, categoryString) {
		/* Return test function, not the result */
		return function () {
			return $("#myframe").contents().find(categoryListSelector).filter( function() { return $.trim($(this).text().toUpperCase())===$.trim(categoryString.toUpperCase()); });
		}
	}

	function handleCategories(record) {

		var condition = null;
		var action = null;

		/* Categories */
		if (typeof record.category !== 'undefined' && record.category.length===3) {

			var category = record.category;

			var cat1Sel = "#syi-categories-l1 ul.listbox li";
			var cat2Sel = "#syi-categories-bucket ul.listbox li";
			var cat3Sel = "#syi-categories-l2 ul.listbox li";

			var listItemCategory1 = getCategoryListItem(cat1Sel, category[0]);
			var listItemCategory2 = getCategoryListItem(cat2Sel, category[1]);
			var listItemCategory3 = getCategoryListItem(cat3Sel, category[2]);

			var categorySelection = 
			{
				"Category 1": {
					"condition": function() { if (listItemCategory1().length>0) { return true; } }, 
					"action"   : function() {
							listItemCategory1().click();
							return listItemCategory2().length>0;
						     }
				},
				"Category 2": {
					"condition": function() { return true; }, 
					"action"   : function() {
							listItemCategory2().click();
							return listItemCategory3().length>0;
						     }
				},
				"Category 3": {
					"condition": function() { return true; }, 
					"action"   : function() {
							listItemCategory3().click();
							return isScreenAfterCategorySelectionActive();
						     }
				}
			};

			var ix=0;
			$.each(categorySelection, function (name, cat) {
				waitForConditionAndExecute(_i++, cat.condition, cat.action, name + ": "+category[ix++]);
			});
		}
	}

	function handleForm(record) {

		var condition = null;
		var action = null;
		var condition2 = null;
		var action2 = null;

		/* Title */
		if (typeof record.title!== 'undefined') {
			condition = function(){if ($("#myframe").contents().find("input[name=title]").length===1) return true;};
			action = function() {$("#myframe").contents().find("input[name=title]").val(record.title)};
			waitForConditionAndExecute(_i++, condition, action, "titel "+record.title);
		}

		/* Select elements */
		if (typeof record.dropdowns !== 'undefined') {
			$.each(record.dropdowns, function(ix,rec) {
				condition = function(){if ($("#myframe").contents().find("label.form-label:Contains('"+ rec[0] +"')").filter(":visible").length>0) return true;}.
				action = function() {
					rec[1] = rec[1].toUpperCase();
					// Find select box value and click on it
					$("#myframe").contents().find("label.form-label:Contains('"+ rec[0] +"')").parent().find("ul.item-frame li").filter( function() { return $(this).text().toUpperCase()===rec[1]; }).click(); 
					// Check if the label of the select box was updated. If not waitForConditionAndExecute will try again.
					return ($("#myframe").contents().find("label.form-label:Contains('"+ rec[0] +"')").parent().find("span.label").text().toUpperCase().indexOf(rec[1])!=-1);
				};
				waitForConditionAndExecute(_i+ix, condition, action, "keuzelijst "+rec[0]+" -> "+rec[1]);
			});
			_i=_i+record.dropdowns.length;
		}

		/* Input elements */
		if (typeof record.inputfields !== 'undefined') {
			$.each(record.inputfields, function(ix,rec) {
				//condition = function(){if ($("#myframe").contents().find("label.form-label:Contains('"+ rec[0] +"')").filter(":visible").length>0) return true;}.bind(null,rec);
				//action = function() {$("#myframe").contents().find("label.form-label:Contains('"+ rec[0] +"')").next().val(rec[1]);}.bind(null,rec);
				condition = function(){if ($("#myframe").contents().find("label:Contains('"+ rec[0] +"')").filter(":visible").length>0) return true;};
				action = function() {$("#myframe").contents().find("label:Contains('"+ rec[0] +"')").next().val(rec[1]);};
				waitForConditionAndExecute(_i+ix, condition, action, "tekstveld "+rec[0]+" -> "+rec[1]);
			});
			_i=_i+record.inputfields.length;
		}

		/* Checkboxes */
		if (typeof record.checkboxes !== 'undefined') {
			$.each(record.checkboxes, function(ix,rec) {
				//console.log(rec);
				condition = function(){if ($("#myframe").contents().find("label:Contains('"+ rec +"')").filter(":visible").length>0) return true;};
				action = function() {
					$("#myframe").contents().find("label:Contains('"+ rec +"')").parent().find("input[type='checkbox']").prop('checked',true);
				};
				waitForConditionAndExecute(_i+ix, condition, action, "aankruisvak "+rec);
			});
			_i=_i+record.checkboxes.length;
		}

		/* Advertisement text in TinyMCE textarea */
		if (typeof record.advertisement !== 'undefined') {
			condition = function(){
				if ($("#myframe").contents().find("iframe#description_ifr").length===1) { return true; }
			};
			action = function() {
				var iframeTinyMCE = $("#myframe").contents().find("iframe#description_ifr");
				if ($(iframeTinyMCE).contents().find("body#tinymce").length===1) {
					$(iframeTinyMCE).contents().find("body#tinymce").html(record.advertisement);
				}
				else return false;
			}
			waitForConditionAndExecute(_i++, condition, action, "wachten op advertentie tekstvak");
		}

		/* Price */
		if (typeof record.price!== 'undefined') {
			condition = function(){if ($("#myframe").contents().find("input[name='price.value']").length===1) return true;};
			action = function() {$("#myframe").contents().find("input[name='price.value']").val(record.price)};
			waitForConditionAndExecute(_i++, condition, action, "prijs "+record.price);
		}

		/* Pricetype */
		if (typeof record.pricetype!== 'undefined') {
			//console.log("pricetype"+record.pricetype);
			condition = function() {if ($("#myframe").contents().find("div.form-field div label:Contains('"+ record.pricetype +"')").length>0) return true;};
			action = function() {
				$("#myframe").contents().find("div.form-field div label:Contains('"+ record.pricetype +"')" ).parent().find("input:first").prop('checked',true);
			};
			waitForConditionAndExecute(_i++, condition, action, "prijstype "+record.pricetype);
		}

		/* Paypal */
		if (typeof record.paypal !== 'undefined') {

			condition = function() {if ($("#myframe").contents().find("input#accept-paypal-switch").length>0) return true;};
			action = function() {
				var check = (record.paypal=="ja") ? true : false;
				$("#myframe").contents().find("input#accept-paypal-switch").prop('checked', check)
			};
			waitForConditionAndExecute(_i++, condition, action, "paypal aankruisvak");
		}

		/* Pictures */
		if (typeof record.pictures !== 'undefined') {

			$.each(record.pictures, function(ix, picPath) {

				_i++;

				$.ajax({
				     type: "POST",
				     url:  "voegFotoToe.php",
				     dataType: "json",
				     tryCount : 0,
				     retryLimit : 3,
				     data: {
					     xsrfToken: $("#myframe").contents().find("input[name='nl.marktplaats.xsrf.token']").val(), 
					     mpSessionID: cookieHandler.getCookie('MpSession'),
					     picturePath: picPath
				     },
				     success: function(data) {
						condition = function() { if ( $("#myframe").contents().find("div.uploader-container.empty:first > input[name='images.ids']").length>0) return true; };
						action = function() {
							/* Pass index too, the first picture could return later than the second */
							setImage(ix, data);
						};
						waitForConditionAndExecute(_i, condition, action, "foto toevoegen");
				     },
				     error : function(xhr, textStatus, errorThrown ) {
					if (xhr.status === 500 || textStatus === 'timeout') {
					    this.tryCount++;
					    if (this.tryCount <= this.retryLimit) {
						//try again
						$.ajax(this);
					    }            
					}
				    }
				});
			});
		}

		// Check if all waitForConditionAndExecute calls have ended
		_checkIfReady = setInterval(function() {
			if (isDone()) {
				setStatusMessage("Excel record succesvol ingevuld");
				clearInterval(_checkIfReady);
			}
		},1000);
	}

	function setStatusMessage(text) {
		$("#status").text(text);
	}

	function handleRecord(record) {

		var condition = null;
		var action = null;
		_i=0;
		_actionSuccessCounter = 0;

		if (typeof record !=='object') return false;

		handleCategories(record);

		/* Complete form */
		condition = function () { return isScreenAfterCategorySelectionActive()};
		action = function () {
			handleForm(record);
		}
		waitForConditionAndExecute(_i++, condition, action, "start formulier invullen", 1000);
	}

	function onClickRecord(link) {

		clearAllIntervals();

		link = link.parentNode;
		window.scrollTo(0,0);

		$("div#excelDiv table tr td").css("font-weight","normal");
		$("table.ExcelTable2007 > tbody > tr td.highlight").css("background-color","white");
		$(link).find("td.highlight").css({"font-weight":"bold","background-color":"#E4ECF7"});

		var iframe = document.getElementById("myframe");
		$("#myframe").contents().find("a.backlink > span").click();
		var linkSplit = link.id.split("-");
		var recordToOpen = parseInt(linkSplit[1]);

		// Save selection for error recovery
		localStorage.lastRowClicked = recordToOpen+1;

		var record = null;
		try {
			record = readRecord(recordToOpen);
			handleRecord(record);
		}
		catch (error) {
			if (error.number===-2146827864 /*Object required*/) {
				openExcelSheet();
				record = readRecord(recordToOpen);
				handleRecord(record);
			}
			else throw error;
		}

	}

	function getRowToClickOn() {

		var rowToClickOn = null;

		if (typeof localStorage.domChangeError !== 'undefined' && typeof localStorage.lastRowClicked !== 'undefined') {
			rowToClickOn = localStorage.lastRowClicked;
			delete localStorage.domChangeError;
		}
		return rowToClickOn;
	}

	function openExcelSheet() {
		excelApp = new ActiveXObject("Excel.Application");
		excelWorkbook = excelApp.Workbooks.Open($("#excelFile").text());
		excelSheet = excelWorkbook.ActiveSheet;
		excelSheet.Application.Visible = true;
	}

	function closeExcelSheet() {
		try {
			excelApp.Application.Quit();
			excelApp = null;
			excelWorkbook = null;
			excelSheet = null;
			CollectGarbage();
			setTimeout("CollectGarbage()",1);
		}
		catch(err) {
			return false;
		}
	}

	function isDone() {
		return _actionSuccessCounter===_i;
	}

	return {
	    isDone: isDone,
	    closeExcelSheet: closeExcelSheet,
	    openExcelSheet: openExcelSheet,
	    readRecord: readRecord,
	    onClickRecord: onClickRecord,
	    getRowToClickOn: getRowToClickOn,
	    checkRequiredColumns: checkRequiredColumns,
	    clearAllIntervals: clearAllIntervals
	}
})();


$(window).load(function() {

	"use strict";

	var _MPEOpenExcelSheetInterval = null;
	var _checkInterval = null;
	var nrOfCheckedRecords = null;
	var recordsQueue=[];

	/* Keep trying to open Excel sheet until user sets correct ActiveX permissions */
	_MPEOpenExcelSheetInterval = setInterval(function() {
		try {
			Marktplaatstabel.openExcelSheet();
			$("div#activeXError").hide();
			clearInterval(_MPEOpenExcelSheetInterval);
			Marktplaatstabel.checkRequiredColumns();
			showExcelSheetInHtmlTable();
		}
		catch (error) {
			Marktplaatstabel.closeExcelSheet();

			if (error.number===-2146827859) {
				/* Show ActiveX explanation and keep trying to open Excel */
				$("div#activeXError:hidden").show();
			}
			else if (error.number===-2146827284) {
				$("div#fileNotFound div.errorMessage div.fullErrorMessage").append(error.message);
				$("div#fileNotFound:hidden").show();
				clearInterval(_MPEOpenExcelSheetInterval);
			}
			else if (error.name==='ReferenceError' && error.message==='ActiveXObject is not defined') {
				$("div#browserNotSupported:hidden").show();
				clearInterval(_MPEOpenExcelSheetInterval);
			}
			else {
				$("div#unknown div.errorMessage").append(error.message);
				$("div#unknown:hidden").show();
				clearInterval(_MPEOpenExcelSheetInterval);
			}
		}
	}, 1000);

	function displayNrOfCheckedRecords() {

		if (nrOfCheckedRecords>0) {
			$("#placeAllCheckedAds").show();
			$("#submitAllChecked").val("Plaats "+nrOfCheckedRecords+" advertentie(s)");
		}
		else {
			$("#placeAllCheckedAds").hide();
		}
	}

        function clickOnElement(element) {
	   	var evt = document.createEvent("MouseEvents");
		evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
		element.dispatchEvent(evt);
    	}

	function processRecordsQueue(recordsQueue) {

		$("table.ExcelTable2007 > tbody > tr").eq(recordsQueue[0]+1).find("td:eq(2)").click();

		_checkInterval = setInterval(function() {

			if (Marktplaatstabel.isDone()) {

				// Click on place advertisement button
			        var pushButton = $("#myframe").contents().find("#syi-place-ad-button")[0];
				clickOnElement(pushButton);

				clearInterval(_checkInterval);
				recordsQueue.shift();
				if (recordsQueue.length>0) 
					processRecordsQueue(recordsQueue);
			}
		}, 1000);
	}

	function showExcelSheetInHtmlTable() {

		$(window).on('beforeunload', function(){ 
			Marktplaatstabel.closeExcelSheet();
		});

		var record = Marktplaatstabel.readRecord(1);
		$("div#nrofrecords").append("Aantal records: "+(parseInt(record.nrofrows)-1)+"<b>");

		var i = 1;
		for (; i <= record.nrofrows; i++) {

			var category = "";
			var title = "";

			if (i>1) record = Marktplaatstabel.readRecord(i);

			if (typeof record.category !== 'undefined')
				category = record.category[1];
			else continue;

			if (typeof record.title !== 'undefined')
				title = record.title;

			var str = "<tr id='rec-"+i+"'>" +
				  "<td><input id='checkbox-"+i+"' class='selectable' type='checkbox'></td>"+
				  "<td class='heading hover' onclick='Marktplaatstabel.onClickRecord(this);return false;'>"+(i+1)+"</td>" +
				  "<td class='highlight hover' onclick='Marktplaatstabel.onClickRecord(this);return false;'>"+title+"</td>" +
				  "<td class='highlight hover' onclick='Marktplaatstabel.onClickRecord(this);return false;'>"+category+"</td>" +
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
		var rowToClickOn = Marktplaatstabel.getRowToClickOn();
		if (rowToClickOn!==null)
			$("table.ExcelTable2007 > tbody > tr").eq(rowToClickOn).find("td:eq(2)").click();
	}
});
