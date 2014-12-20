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

var XmlReader = (function() {

	"use strict";

    
        function XmlReader(query) {

            this.records = null;
            this.recordsCache = [];
            this.errors = [];

            this.MAX_NR_OF_PICTURES = 20;
            this.COLUMN_HEADERS = [
                   'title',
                   'description',
                   'price',
                   'photos',
                   'marktplaats_rubriek',
                   'marktplaats_keuzelijsten',
                   'marktplaats_aankruisvakjes',
                   'marktplaats_overige_invoervelden',
                   'marktplaats_prijssoort',
                   'marktplaats_kies_ander_prijstype',
                   'marktplaats_paypal',
            ];

            var _this = this;

            $.ajax({

                    type: "GET",
                    url: "http://ssl.marktplaatstabel.services/"+query,
                    //url: "http://ssl.marktplaatstabel.services/marktplaatstabel/mptool.xml",
                    async: false,
                    dataType: "text",
                    success: function(xmlString) {
                        // Convert all XML tags to lowercase because getElementsByTagName is case
                        // sensitive with XML, and users may have capitalized custom defined tags.
                        xmlString = xmlString.replace(/<\/?[A-Z]+.*?>/g, function (m) { return m.toLowerCase(); });
                        try {
                            var xml = $.parseXML(xmlString);
                            _this.records = $(xml).find("description").parent();
                            if (_this.records.length===0)
                                throw new Error("Geen geldig XML document. Description tag niet gevonden.");
                        }
                        catch(error) {
                            _this.errors.push("Geen geldig XML document. Structuur kon niet worden ontleedt.");
                        }
                    }
            });
        }

        XmlReader.prototype.getErrors = function() {
            return this.errors;
        }

        function setGetterForEachXmlTag(_this, xmlRecord) {

            // Create getter for each field in COLUMN_HEADERS
            $.each(_this.COLUMN_HEADERS, function (ix, colName) {

                    if (typeof xmlRecord[colName]==="undefined" || xmlRecord[colName]===null) {

                        Object.defineProperty(xmlRecord, colName, {

                            get: function() {

                                var cacheName = "_" + colName;

                                if (typeof this[cacheName]==="undefined") 
                                {
                                    var match = $(this).find(colName);
                                    var result = null;
                                    var data = "";

                                    // Build array for all elements containing multiple elements
                                    if (match.children().length > 0) {
                                        result = new Array();
                                        match.children().each(function() {
                                            result.push(trimAndRemoveCDATATags($(this).text()));
                                        });
                                    }
                                    else {
                                        result = (match.length > 0) ? trimAndRemoveCDATATags(match.text()) : null;
                                    }
                                    this[cacheName] = result;
                                }
                                return this[cacheName];
                            }
                        });
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

        function trimAndRemoveCDATATags(data) {
            return $.trim(data.replace("<![CDATA[", "").replace("]]>", ""));
        }

        XmlReader.prototype.readRecord = function(nr) {

            if (typeof this.recordsCache[nr] !== 'undefined')
                return this.recordsCache[nr];

            var xmlRecord = this.records.get(nr);
            setGetterForEachXmlTag(this, xmlRecord);

            var found = null;
            var _this = this;
            var newRecord = {};

	    newRecord.nrofrows       = this.records.length;
            newRecord.nr             = nr;

	    newRecord.category       = null;
	    newRecord.dropdowns      = null;
	    newRecord.checkboxes     = null;
	    newRecord.inputfields    = null;
	    newRecord.pictures       = [];

	    newRecord.title          = null;
	    newRecord.advertisement  = null;
	    newRecord.price          = null;
	    newRecord.pricetype      = null;
	    newRecord.otherpricetype = null;
	    newRecord.paypal         = null;

            newRecord.title          = $.trim(xmlRecord.title);
            newRecord.advertisement  = $.trim(xmlRecord.description);
            newRecord.price          = $.trim(xmlRecord.price);
	    newRecord.pricetype      = $.trim(xmlRecord.marktplaats_prijssoort);
	    newRecord.otherpricetype = $.trim(xmlRecord.marktplaats_kies_ander_prijstype);

            // Process categories. See also: FormFiller.CategoryRules
            if (xmlRecord.marktplaats_rubriek !== null)
            { 
                // Split by semicolon or unicode right-pointing triangle
                var categoryArray = parseStringToArray(xmlRecord.marktplaats_rubriek, /[;\u25B6]/);
                if (parseStringToArray!==null) {
                    $.each(categoryArray, function(ix,val) {
                            // Put each category in a separate newRecord variable.
                            var key="category"+(ix+1);
                            newRecord[key]=val;
                    });
                }
            }

            if (xmlRecord.photos !== null)
            {
                $.each(xmlRecord.photos, function(key, value) {
                    newRecord.pictures.push(value);
                });
            }

	    if (xmlRecord.marktplaats_keuzelijsten !== null) {
	    	newRecord.dropdowns = parseStringTo2DArray(xmlRecord.marktplaats_keuzelijsten);
            }

	    if (xmlRecord.marktplaats_aankruisvakjes!== null) {
	    	newRecord.checkboxes = parseStringToArray(xmlRecord.marktplaats_aankruisvakjes, ",");
            }

	    if (xmlRecord.marktplaats_paypal !== null) {
	    	newRecord.paypal = xmlRecord.marktplaats_paypal.toLowerCase();
            }

	    if (xmlRecord.marktplaats_overige_invoervelden !== null) {
	    	newRecord.inputfields = parseStringTo2DArray(xmlRecord.marktplaats_overige_invoervelden);
            }

            this.recordsCache[nr] = newRecord;
            return newRecord;
        }

        return XmlReader;
})();
