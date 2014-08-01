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

	var excelApp = null;
	var excelWorkbook = null;
	var excelSheet = null;

	var _domChangeTimer = [];
	var _domChangeDelay = 1000;
	var record = null;

	jQuery.expr[':'].Contains = function(a,i,m){
	     	return (a.textContent || a.innerText || "").toUpperCase().indexOf(m[3].toUpperCase())>=0;
	};

	/* Wait for DOM mutation and execute action function.
	 * Simulates: MutationObserver, DOMSubtreeModified
	 * http://www.w3.org/TR/DOM-Level-3-Events/#event-type-DOMSubtreeModified
	 * http://www.w3.org/TR/2014/WD-dom-20140710/#mutation-observers
	 **/
	function waitForConditionAndExecute(id, condition, action, text, time) {
		console.log("id:"+id);

	   if (_domChangeTimer[id]!=null) 
	       clearInterval(_domChangeTimer[id]);

	   _domChangeTimer[id] = setInterval(function() {

		console.log("before cond id:"+id+" " +text);

		try {
			if(condition()) {
				console.log("after cond id:"+id+" "+text);
				if (action()!==false) 
					clearInterval(_domChangeTimer[id]);
			}
		}
		catch(error) {
			/* Clicking records too fast generating too many timers
			 * will result in IE Permission denied errors. */
			console.log("Dom change error: "+error);
			localStorage.domChangeError = true;
			location.reload(true);
		}
	   }, _domChangeDelay);
	}

	function clearDomIntervals() {
		$.each(_domChangeTimer, function(ix,val) {
			clearInterval(_domChangeTimer[ix]);
		});
	}

	function readRecord(nr) {

		console.log(nr);
		var record = {};

		try {
			record.nrofrows      = excelSheet.UsedRange.Rows.Count-1;
			record.category      = excelSheet.Cells(nr+1,1).Value;
			record.title         = excelSheet.Cells(nr+1,2).Value;
			record.dropdowns     = excelSheet.Cells(nr+1,3).Value;
			record.checkboxes    = excelSheet.Cells(nr+1,4).Value;
			record.advertisement = excelSheet.Cells(nr+1,5).Value;
			record.price         = excelSheet.Cells(nr+1,6).Value;
			record.pricetype     = excelSheet.Cells(nr+1,7).Value;
			record.paypal        = excelSheet.Cells(nr+1,8).Value;
			record.inputfields   = excelSheet.Cells(nr+1,9).Value;
		}
		catch(err) {
			return false;
		}

		if (typeof record.category !== 'undefined') {
			record.category = record.category.split(";");
			$.each(record.category, function(ix,val) {
				record.category[ix]=val.trim();
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

        function getCategoryListItem (categoryListSelector, categoryString) {
		return function () {
			return $("#myframe").contents().find(categoryListSelector).filter( function() { return $.trim($(this).text().toUpperCase())===$.trim(categoryString.toUpperCase())});
		}
	}

	function handleRecord(record) {

		var condition = null;
		var action = null;
		var _i = 0;

		if (typeof record !=='object') return false;

		/* Categories */
		if (typeof record.category !== 'undefined') {

			var cat1Sel = "#syi-categories-l1 ul.listbox li";
			var cat2Sel = "#syi-categories-bucket ul.listbox li";
			var cat3Sel = "#syi-categories-l2 ul.listbox li";
			var isScreenAfterCategorySelectionActive = function() { return $("#myframe").contents().find("#syi-breadcrumbs-content").length > 0 };

			var category = record.category;

			var getCategory1 = getCategoryListItem(cat1Sel, category[0]);
			var getCategory2 = getCategoryListItem(cat2Sel, category[1]);
			var getCategory3 = getCategoryListItem(cat3Sel, category[2]);

			/* Category 1 */
			condition = function(){ if (getCategory1().length>0) return true;};
			action = function() {
				getCategory1().click();
				// Clicking on cat 1 is succesful, when cat 2 is present, else try again
				return getCategory2().length>0;
			}
			waitForConditionAndExecute(++_i, condition, action, "category"+category[0]);

			/* Category 2 */
			condition = function(){ return true;};
			action = function() {
				getCategory2().click();
				// Clicking on cat 2 is succesful, when cat 3 is present, else try again
				return getCategory3().length>0;
			}
			waitForConditionAndExecute(++_i, condition, action, "category"+category[1]);

			/* Category 3 */
			condition = function(){ return true;};
			action = function() {
				getCategory3().click();
				// Clicking on cat 3 is succesful when new advertisment form was opened
				return isScreenAfterCategorySelectionActive();
			}
			waitForConditionAndExecute(++_i, condition, action, "category"+category[2]);
		}

		/* Title */
		if (typeof record.title!== 'undefined') {
			condition = function(){if ($("#myframe").contents().find("input[name=title]").length===1) return true;};
			action = function() {$("#myframe").contents().find("input[name=title]").val(record.title)};
			waitForConditionAndExecute(++_i, condition, action, "title");
		}

		/* Select elements */
		if (typeof record.dropdowns !== 'undefined') {
			++_i;
			$.each(record.dropdowns, function(ix,rec) {
				condition = function(){if ($("#myframe").contents().find("label.form-label:Contains('"+ rec[0] +"')").filter(":visible").length>0) return true;}.bind(null,rec);
				action = function() {
					rec[1] = rec[1].toUpperCase();
					// Find select box value and click on it
					$("#myframe").contents().find("label.form-label:Contains('"+ rec[0] +"')").parent().find("ul.item-frame li").filter( function() { return $(this).text().toUpperCase()===rec[1]; }).click(); 
					// Check if the label of the select box was updated. If not waitForConditionAndExecute will try again.
					return ($("#myframe").contents().find("label.form-label:Contains('"+ rec[0] +"')").parent().find("span.label").text().toUpperCase().indexOf(rec[1])!=-1);
				}.bind(null,rec);
				waitForConditionAndExecute(_i+ix, condition, action, "dropdowns"+rec[0]+"->"+rec[1], "dropdowns"+rec[1]);
			});
			_i=_i+record.dropdowns.length;
		}

		/* Input elements */
		if (typeof record.inputfields !== 'undefined') {
			++_i;
			$.each(record.inputfields, function(ix,rec) {
				//condition = function(){if ($("#myframe").contents().find("label.form-label:Contains('"+ rec[0] +"')").filter(":visible").length>0) return true;}.bind(null,rec);
				//action = function() {$("#myframe").contents().find("label.form-label:Contains('"+ rec[0] +"')").next().val(rec[1]);}.bind(null,rec);
				condition = function(){if ($("#myframe").contents().find("label:Contains('"+ rec[0] +"')").filter(":visible").length>0) return true;}.bind(null,rec);
				action = function() {$("#myframe").contents().find("label:Contains('"+ rec[0] +"')").next().val(rec[1]);}.bind(null,rec);
				waitForConditionAndExecute(_i+ix, condition, action, "inputfields"+rec[0]+"->"+rec[1], "intputfields"+rec[1]);
			});
			_i=_i+record.inputfields.length;
		}

		/* Checkboxes */
		if (typeof record.checkboxes !== 'undefined') {
			++_i;
			$.each(record.checkboxes, function(ix,rec) {
				console.log(rec);
				condition = function(){if ($("#myframe").contents().find("label:Contains('"+ rec +"')").filter(":visible").length>0) return true;}.bind(null,rec);
				action = function() {
					$("#myframe").contents().find("label:Contains('"+ rec +"')").parent().find("input[type='checkbox']").prop('checked',true);
				}.bind(null,rec);
				waitForConditionAndExecute(_i+ix, condition, action, "checkboxes"+rec);
			});
			_i=_i+record.checkboxes.length;
		}

		/* Advertisement text in TinyMCE textarea */
		if (typeof record.advertisement !== 'undefined') {
			condition = function(){if ($("#myframe").contents().find("iframe#description_ifr").length===1) return true;};
			action = function() {
				var iframeTinyMCE = $("#myframe").contents().find("iframe#description_ifr");

				//console.log("iframe tinymce:"+$(iframeTinyMCE).length);
				//console.log("body tinymce:"+$(iframeTinyMCE).contents().find("body#tinymce").length);
				//console.log(record.advertisement);

				condition = function() {if ($(iframeTinyMCE).contents().find("body#tinymce").length===1) return true;};
				action = function() {$(iframeTinyMCE).contents().find("body#tinymce").html(record.advertisement)};
				waitForConditionAndExecute(++_i, condition, action, "addvertisement");
			};
			waitForConditionAndExecute(++_i, condition, action, "addvertisement");
		}

		/* Price */
		if (typeof record.price!== 'undefined') {
			condition = function(){if ($("#myframe").contents().find("input[name='price.value']").length===1) return true;};
			action = function() {$("#myframe").contents().find("input[name='price.value']").val(record.price)};
			waitForConditionAndExecute(++_i, condition, action, "price");
		}

		/* Pricetype */
		if (typeof record.pricetype!== 'undefined') {
			console.log("pricetype"+record.pricetype);
			condition = function() {if ($("#myframe").contents().find("div.form-field div label:Contains('"+ record.pricetype +"')").length>0) return true;}.bind(null,record);
			action = function() {
				$("#myframe").contents().find("div.form-field div label:Contains('"+ record.pricetype +"')" ).parent().find("input:first").prop('checked',true);
			}.bind(null,record);
			waitForConditionAndExecute(++_i, condition, action, "pricetype");
		}

		/* Paypal */
		if (typeof record.paypal !== 'undefined') {

			condition = function() {if ($("#myframe").contents().find("input#accept-paypal-switch").length>0) return true;};
			action = function() {
				var check = (record.paypal=="ja") ? true : false;
				$("#myframe").contents().find("input#accept-paypal-switch").prop('checked', check)
			}.bind(null,record);
			waitForConditionAndExecute(++_i, condition, action,"paypal checkbox");
		}


	}

	function onClickRecord(link) {

		clearDomIntervals();
		window.scrollTo(0,0);
		$("div#excelDiv table tr td").css("font-weight","normal").parent().css("background-color","white");
		$(link).find("td").css("font-weight","bold").parent().css("background-color","#E4ECF7");
		var iframe = document.getElementById("myframe");
		$("#myframe").contents().find("a.backlink > span").click();

		var linkSplit = link.id.split("-");
		var recordToOpen = parseInt(linkSplit[1]);

		// Save selection for error recovery
		localStorage.lastRowClicked = recordToOpen+1;

		var record = readRecord(recordToOpen);

		if (record===false) {
			openExcelSheet();
			record = readRecord(recordToOpen);
		}
		handleRecord(record);
	}

	function getFirstRowToClickOn() {

		var rowToClickOn = 2; // First record starts on row 2. First row contains headers.

		if (typeof localStorage.domChangeError !== 'undefined' && typeof localStorage.lastRowClicked !== 'undefined') {
			rowToClickOn = localStorage.lastRowClicked;
			delete localStorage.domChangeError;
		}
		return rowToClickOn;
	}

	function openExcelSheet() {
		excelApp = new ActiveXObject("Excel.Application");
		excelWorkbook = excelApp.Workbooks.Open($("#excelFile").text());
		excelSheet = excelWorkbook.Worksheets("Sheet1");
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

	return {
	    closeExcelSheet: closeExcelSheet,
	    openExcelSheet: openExcelSheet,
	    readRecord: readRecord,
	    onClickRecord: onClickRecord,
	    getFirstRowToClickOn: getFirstRowToClickOn
	}
})();



var _MPEOpenExcelSheetInterval = null;

$(window).load(function() {

	_MPEOpenExcelSheetInterval = setInterval(function() {
		try {
			Marktplaatstabel.openExcelSheet();
			$("div#activeXError").hide();
			clearInterval(_MPEOpenExcelSheetInterval);
			showExcelSheetInHtmlTable();
		}
		catch (error) {
			Marktplaatstabel.closeExcelSheet();
			console.log(error);
			if (error.number===-2146827859) {
				$("div#activeXError:hidden").show();
			}
			else if (error.number===-2146827284) {
				$("div#fileNotFound div.errorMessage").append(error.message);
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


	function showExcelSheetInHtmlTable() {

		$(window).on('beforeunload', function(){ 
			Marktplaatstabel.closeExcelSheet();
		});

		// Accept cookies
		cookieHandler.setCookie("CookieOptIn", "true", 265);	

		//console.log("--Kies uw rubriek--");

		record = Marktplaatstabel.readRecord(1);

		$("div#nrofrecords").append("Aantal records: "+record.nrofrows+"<b>");

		var i = 1;
		for (; i <= record.nrofrows; i++) {

			var _category = "";
			var _title = "";

			record = Marktplaatstabel.readRecord(i);

			if (typeof record.category !== 'undefined')
				_category = record.category[1];

			if (typeof record.title !== 'undefined')
				_title = record.title;

			var str = "<tr id='rec-"+i+"' onclick='Marktplaatstabel.onClickRecord(this);return false;'>" +
				  "<td class='heading'>"+(i+1)+"</td>" +
				  "<td>"+_title+"</td><td>"+_category+"</td>" +
				  "</tr>";

			$("div#excelDiv > div.body > table.ExcelTable2007 > tbody").append(str);
			$(".ExcelTable2007 tr").hover(excelTable2007MouseEnter, excelTable2007MouseLeave);
		}

		// Unhide excel table
		$("div#excelDiv > div.body > table").css("display", "inline-block");

		// Click first record
		$("div#excelDiv > div.body > table > tbody > tr").eq(Marktplaatstabel.getFirstRowToClickOn()).click();
	}
});
