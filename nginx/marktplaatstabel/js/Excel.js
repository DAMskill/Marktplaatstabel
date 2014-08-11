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

var Excel = (function() {

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

        var _MPEOpenExcelSheetInterval = null;
	var excelApp = null;
	var excelWorkbook = null;
	var excelSheet = null;

	var record = null;
	var columnPositions = null;

        function init() {

                /* Keep trying to open Excel sheet until user sets correct ActiveX permissions */
                _MPEOpenExcelSheetInterval = setInterval(function() {
                        try {
                                Excel.openExcelSheet();
                                $("div#activeXError").hide();
                                clearInterval(_MPEOpenExcelSheetInterval);
                                HTMLTableHandler.showExcelSheetInHtmlTable();
                        }
                        catch (error) {
                                Excel.closeExcelSheet();

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
        }

	function openExcelSheet() {
		excelApp = new ActiveXObject("Excel.Application");
		excelWorkbook = excelApp.Workbooks.Open($("#excelFile").text());
		excelSheet = excelWorkbook.ActiveSheet;
		excelSheet.Application.Visible = true;

		checkRequiredColumns();
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

	function checkRequiredColumns() {
		var found = null;
		$.each(COLUMN_HEADERS, function (ix, colName) {
			found =	excelSheet.Rows(1).Find(colName);
			if (found===null) {
				throw new Error("Kolom <b>'"+colName+"'</b> niet gevonden in Excel sheet.")
			}
		});
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

		if (columnPositions === null) {
			columnPositions = {};
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
		}
		return columnPositions;
	}

	function readRecord(nr) {

		var record = {};

		/* Fetch column position */
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
		while (typeof excelSheet.Cells(nr+1, pictureIndex).Value !== 'undefined' && 
                        pictureIndex < (MAX_NR_OF_PICTURES + parseInt(columnPositions.firstPictureColumn))) 
                {
			record.pictures += ';' + excelSheet.Cells(nr+1,pictureIndex++).Value;
		}

                $.each(record, function(key, value) {
                    if (typeof value==='undefined')
                        delete record[key];
                });

		if (typeof record.category !== 'undefined') {
			record.category = record.category.split(";");
			$.each(record.category, function(ix,val) {
				val=$.trim(val);
				if (val!=='') {
                                        var key="category"+(ix+1);
					record[key]=val;
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

	return {
	    "closeExcelSheet": closeExcelSheet,
	    "openExcelSheet": openExcelSheet,
	    "readRecord": readRecord,
	    "checkRequiredColumns": checkRequiredColumns,
	    "init": init 
	}
})();

