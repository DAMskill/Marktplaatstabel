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

function excelTable2007MouseEnter() {

	$("td", this.parentNode).each(function(ix, value) {

                // Skip first two rows (column names and table headers)
		if ($(this).parent().index()<=1) return;

		if (ix===1) {
			$(this).addClass("orangeIndexBackground");
			return;
		}
		if (ix===2) {
			$(this).addClass("topLeftBottomBorder");
			return;
		}
		if (ix===3) {
			$(this).addClass("topRightBottomBorder");
		}
	});
};

function excelTable2007MouseLeave() {
	$("td", this.parentNode).each(function(ix, value) {
		if (ix===1) {
			$(this).removeClass("orangeIndexBackground");
			return;
		}
		else if (ix>1){
			$(this).removeClass("topLeftBottomBorder");
			$(this).removeClass("topRightBottomBorder");
		}
	});
}
