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

        function ExcelReader(localExcelFilePath) {

            this.records = null;
            this.record = null;
            this.errors = [];

            this.MAX_NR_OF_PICTURES = 20;
            this.REQUIRED_COLUMN_HEADERS = [
                   'Rubriek',
                   'Titel',
                   'Advertentie'
            ];

            this.record = null;
            this.columnPositions = null;

            var _this = this;

            $.ajax({
                    type: "GET",
                    url: "http://ssl.marktplaatstabel.services/"+localExcelFilePath,
                    async: false,
                    dataType: "json",
                    success: function(data) {
                        _this.records = data;
                        if (_this.records.length===0)
                            _this.errors.push("Geen geldig Excel document");
                        else checkRequiredColumns.call(_this);
                    },
                    error: function(error) {
                            _this.errors.push("Geen geldig Excel document");
                    }
            });
        }

        ExcelReader.prototype.getErrors = function() {
            return this.errors;
        }

	function checkRequiredColumns() {
                var _this = this;
		var found = null;
                // Check first record for required field/column names
		$.each(this.REQUIRED_COLUMN_HEADERS, function (ix, colName) {
                    var objectKeys = Object.keys(_this.records[0]).map(function(key) {
                        return key.toLowerCase();
                    });
                    if (objectKeys.indexOf(colName.toLowerCase())===-1) {
                        _this.errors.push("Verplichte kolom <b>'"+colName+"'</b> niet gevonden");
                    }
		});
	}

	function parseStringTo2DArray(arrayAsString) {

                if (typeof arrayAsString!=='undefined')
                {
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
                return null;
	}

	function parseStringToArray(arrayAsString, delimiter) {

                if (typeof arrayAsString!=='undefined' && typeof delimiter!=='undefined')
                {
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
                return null;
	}

	ExcelReader.prototype.readRecord = function(nr) {

		var record = {};

                record.nr            = nr;

		record.nrofrows       = this.records.length;

		record.category       = this.records[nr]['Rubriek'];
		record.dropdowns      = this.records[nr]['Keuzelijsten'];
		record.checkboxes     = this.records[nr]['Aankruisvakjes'];
		record.inputfields    = this.records[nr]['Overige invoervelden'];

		record.title          = this.records[nr]['Titel'];
		record.advertisement  = this.records[nr]['Advertentie'];
		record.price          = this.records[nr]['Vraagprijs'];
		record.pricetype      = this.records[nr]['Prijssoort'];
		record.otherpricetype = this.records[nr]['Kies ander prijstype'];
		record.paypal         = this.records[nr]['Paypal'];

                // Remove empty and undefined values
                $.each(record, function(key, value) {
                    if (typeof value==='undefined' || $.trim(value)==='')
                        delete record[key];
                });

		record.pictures = [];
		var pictureIndex = 1;
                var picPath = null;
                do {
                    picPath = this.records[nr]['Foto '+pictureIndex];
                    if (typeof picPath !== 'undefined' && $.trim(picPath)!=='')
                        record.pictures.push(picPath);
                    else break;
                }
		while (typeof this.records[nr]['Foto ' + ++pictureIndex]!=='undefined');

                // Process categories. See also: FormFiller.CategoryRules
                if (typeof record.category !== 'undefined')
                { 
                    // Split by semicolon or unicode right-pointing triangle
                    var categoryArray = parseStringToArray(record.category, /[;\u25B6]/);
                    if (parseStringToArray!==null) {
                        $.each(categoryArray, function(ix,val) {
                                // Put each category in a separate record variable.
                                var key="category"+(ix+1);
                                record[key]=val;
                        });
                    }
                    delete record.category;
                }

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

