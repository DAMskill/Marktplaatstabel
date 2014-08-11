<?php
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
?>
<?php require('ResponsiveFilemanager/config/config.php'); ?>
<!DOCTYPE HTML>
<html>

<?php  if (isset($_GET["file"])) { /* HTTPS://LOCALHOST MARKTPLAATS */ ?>

	<head>
	        <meta content="Marktplaatstabel - Marktplaats bedienen met excel!">
		<script type='text/javascript' src='https://localhost/marktplaatstabel/js/jquery-2.1.1.js'></script> 
		<script type='text/javascript' src='https://localhost/marktplaatstabel/js/CookieHandler.js'></script>
		<script type='text/javascript' src='https://localhost/marktplaatstabel/js/HTMLTableHandler.js'></script>
		<script type='text/javascript' src='https://localhost/marktplaatstabel/js/Excel.js'></script>
		<script type='text/javascript' src='https://localhost/marktplaatstabel/js/EventHandler.js'></script>
		<script type='text/javascript' src='https://localhost/marktplaatstabel/js/FormFiller.js'></script>
		<script type='text/javascript' src='https://localhost/marktplaatstabel/js/excel-2007-hover-css.js'></script>
		<script>
                    $(window).ready(function() {

                        Excel.init();

                        $("#myframe").on("load", function() {
                            var record = HTMLTableHandler.getRecord();
                            if (record !== null) {
                                FormFiller.fillForm(record);
                            }
                        });

                    });
                </script>
		<link type='text/css' href='https://localhost/marktplaatstabel/css/marktplaatsmagic.css' rel='stylesheet'>
		<link type='text/css' href='https://localhost/marktplaatstabel/css/excel-2007.css' rel='stylesheet'>
		<title>Marktplaatstabel</title>
	</head>
	<body>
		<iframe id="myframe" src="https://localhost/syi/plaatsAdvertentie.html"></iframe>

		<div id="excelDiv">
			<div class="headerRight">
				<img id="logo" src="/mpexcel-32x32.ico">
				<div class="title">Marktplaatstabel</div>
				<div id="activity"></div>
				<div class="topMenu"><a href="http://localhost/marktplaatstabel">Terug naar bestandsoverzicht</a></div>
			</div>
			<div id="headerBottom"></div>
			<div class="body">
				<div id="excelFile"><?php echo "C:\Users\Public\Documents".$upload_dir.$_GET["file"]; ?></div>
				<div id="excelFileHeader">Excel sheet: <b><?php echo $_GET["file"]; ?></b></div>
                                <div id="help">
					<div id="activeXError"><?php require('php/ActiveXError.php'); ?></div>
					<div id="browserNotSupported">
						<div class="errorMessage">Voor deze toepassing kunt u uitsluitend Internet Explorer gebruiken.</div>
					</div>
					<div id="fileNotFound">
						<div class="errorMessage">Bestand niet gevonden: <div class="fullErrorMessage"></div></div>
					</div>
					<div id="unknown">
						<div class="errorMessage"></div>
					</div>
				</div>
				<div id="nrofrecords"></div>
				<div id="status"></div>
                                <div id="placeAllCheckedAds"><input id="submitAllChecked" type="submit" value="Plaats advertenties"></div>
                                <div id="tableBox">
					<table class="ExcelTable2007">
						<tbody>
							<tr><th><input id="checkAll" type="checkbox"></th><th class="heading">&nbsp;</th><th>A</th><th>B</th></tr>
							<tr><td><input type="checkbox" disabled></td><td class="heading">1</td><td><b>Titel</b></td><td><b>Rubriek</b></td></tr>
						</tbody>
					</table>

				</div>
			</div>
		</div>

	</body>

<?php } else { /* HTTP://LOCALHOST RESPONSIVE FILE MANAGER */ ?>

	<head>
		<title>Marktplaatstabel</title>
	        <meta content="Marktplaatstabel - Marktplaats bedienen met excel!"></meta>
		<script type='text/javascript' src='http://localhost/marktplaatstabel/js/jquery-2.1.1.js'></script> 
		<link type='text/css' href='http://localhost/marktplaatstabel/css/marktplaatsmagic.css' rel='stylesheet'>
	</head>
	<body>

        <div style="margin:20px;">
	<div id="maintitle">Marktplaatstabel</div>
        Selecteer een Excel bestand:
	<iframe id="responsiveFilemanager" src="ResponsiveFilemanager/dialog.php?type=0"></iframe>
	</div>

	</body>

<?php } ?>
</html>
