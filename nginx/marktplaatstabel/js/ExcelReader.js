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

var ExcelReader = (function() {

	"use strict";

        function ExcelReader(fullPathExcelFile) {

            this.fullPathExcelFile = fullPathExcelFile;
            this.MAX_NR_OF_PICTURES = 20;
            this.COLUMN_HEADERS = [
                   'Rubriek',
                   'Titel',
                   'Keuzelijsten',
                   'Aankruisvakjes',
                   'Advertentie',
                   'Vraagprijs',
                   'Prijssoort',
                   'Kies ander prijstype',
                   'Paypal',
                   'Overige invoervelden',
                   'Voeg foto toe'
            ];

            this.excelApp = null;
            this.excelWorkbook = null;
            this.excelSheet = null;

            this.record = null;
            this.columnPositions = null;
        }


	ExcelReader.prototype.openExcelSheet = function() {
            this.excelApp = new ActiveXObject("Excel.Application");
            this.excelWorkbook = this.excelApp.Workbooks.Open(this.fullPathExcelFile);
            this.excelSheet = this.excelWorkbook.ActiveSheet;
            this.excelSheet.Application.Visible = true;
            checkRequiredColumns.call(this);
	}

	ExcelReader.prototype.closeExcelSheet = function() {
            try {
                    this.excelApp.Application.Quit();
                    this.excelApp = null;
                    this.excelWorkbook = null;
                    this.excelSheet = null;
                    CollectGarbage();
                    setTimeout("CollectGarbage()",1);
            }
            catch(err) {
                    return false;
            }
	}

	function checkRequiredColumns() {
		var found = null;
                var _this = this;
		$.each(this.COLUMN_HEADERS, function (ix, colName) {
			found =	_this.excelSheet.Rows(1).Find(colName);
			if (found===null) {
				throw new Error("Kolom <b>'"+colName+"'</b> niet gevonden in Excel sheet.")
			}
		});
	}

	function getColumnNumberByName(columnName) {
		var found = $.inArray(columnName, this.COLUMN_HEADERS);
		if (found===-1) {
			throw new Error("Softwarefout: kolom <b>'"+columnName+"'</b> is niet geregistreerd.")
		}
		else {
			return this.excelSheet.Rows(1).Find(columnName).Column;
		}
	}

	function getColumnPositions() {

		if (this.columnPositions === null) {
			this.columnPositions = {};
			this.columnPositions.categoryColumn      = getColumnNumberByName.call(this,'Rubriek');
			this.columnPositions.titleColumn         = getColumnNumberByName.call(this,'Titel');
			this.columnPositions.dropdownColumn      = getColumnNumberByName.call(this,'Keuzelijsten');
			this.columnPositions.checkboxColumn      = getColumnNumberByName.call(this,'Aankruisvakjes');
			this.columnPositions.advertisementColumn = getColumnNumberByName.call(this,'Advertentie');
			this.columnPositions.priceColumn         = getColumnNumberByName.call(this,'Vraagprijs');
			this.columnPositions.pricetypeColumn     = getColumnNumberByName.call(this,'Prijssoort');
			this.columnPositions.otherPriceType      = getColumnNumberByName.call(this,'Kies ander prijstype');
			this.columnPositions.paypalColumn        = getColumnNumberByName.call(this,'Paypal');
			this.columnPositions.inputColumn         = getColumnNumberByName.call(this,'Overige invoervelden');
			this.columnPositions.addPictureColumn    = getColumnNumberByName.call(this,'Voeg foto toe');
			this.columnPositions.firstPictureColumn  = parseInt(this.columnPositions.addPictureColumn)+1;
		}
		return this.columnPositions;
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

	function parseStringToArray(arrayAsString, delimiter) {

		var splitArray = arrayAsString.split(delimiter);
		var newArray = new Array();
		$.each(splitArray, function(ix,val) {
			if (typeof val ==='undefined' || val==='') {
				return;
			}
			newArray[ix]=$.trim(val);
		});
		return newArray;
	}

	ExcelReader.prototype.readRecord = function(nr) {

		var record = {};

                record.nr            = nr;
		/* Fetch column position */
		var columnPositions = getColumnPositions.call(this);

		record.nrofrows       = this.excelSheet.Cells.Find("*", this.excelSheet.Cells(1), -4163, 1, 1, 2).Row

		record.category       = this.excelSheet.Cells(nr+1, columnPositions.categoryColumn).Value;
		record.dropdowns      = this.excelSheet.Cells(nr+1, columnPositions.dropdownColumn).Value;
		record.checkboxes     = this.excelSheet.Cells(nr+1, columnPositions.checkboxColumn).Value;
		record.inputfields    = this.excelSheet.Cells(nr+1, columnPositions.inputColumn).Value;
		record.pictures       = [];

		record.title          = this.excelSheet.Cells(nr+1, columnPositions.titleColumn).Value;
		record.advertisement  = this.excelSheet.Cells(nr+1, columnPositions.advertisementColumn).Value;
		record.price          = this.excelSheet.Cells(nr+1, columnPositions.priceColumn).Value;
		record.pricetype      = this.excelSheet.Cells(nr+1, columnPositions.pricetypeColumn).Value;
		record.otherpricetype = this.excelSheet.Cells(nr+1, columnPositions.otherPriceType).Value;
		record.paypal         = this.excelSheet.Cells(nr+1, columnPositions.paypalColumn).Value;

                $.each(record, function(key, value) {
                    if (typeof value==='undefined')
                        delete record[key];
                });

		var pictureIndex = columnPositions.firstPictureColumn;
                var picPath = null;
                do {
                    picPath = this.excelSheet.Cells(nr+1, pictureIndex++).Value;
                    if (typeof picPath !== 'undefined' && $.trim(picPath)!=='')
                        record.pictures.push(picPath);
                    else break;
                }
		while (pictureIndex < (this.MAX_NR_OF_PICTURES + parseInt(columnPositions.firstPictureColumn)));

                // Process categories. See also: FormFiller.CategoryRules
                var categoryArray = parseStringToArray(record.category, ";");
		$.each(categoryArray, function(ix,val) {
                        // Put each category in a separate record variable.
                        var key="category"+(ix+1);
			record[key]=val;
		});

		if (typeof record.dropdowns !== 'undefined')
			record.dropdowns = parseStringTo2DArray(record.dropdowns);

		if (typeof record.checkboxes !== 'undefined')
			record.checkboxes = parseStringToArray(record.checkboxes, ",");

		if (typeof record.paypal !== 'undefined')
			record.paypal = record.paypal.toLowerCase();

		if (typeof record.inputfields !== 'undefined')
			record.inputfields = parseStringTo2DArray(record.inputfields);

		return record;
	}

	return ExcelReader;
})();

