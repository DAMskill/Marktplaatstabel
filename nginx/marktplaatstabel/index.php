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
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>

<?php  if (isset($_GET["file"])) { /* HTTPS://LOCALHOST MARKTPLAATS */ ?>

	<head>
		<!-- <script type='text/javascript' src='https://localhost/marktplaatsmagic2-min.js'></script> -->
		<script type='text/javascript' src='https://localhost/marktplaatstabel/jquery-2.1.1.js'></script> 
		<script type='text/javascript' src='https://localhost/marktplaatstabel/marktplaatsmagic.js'></script>
		<script type='text/javascript' src='https://localhost/marktplaatstabel/excel-2007-hover-css.js'></script>
		<link type='text/css' href='https://localhost/marktplaatstabel/marktplaatsmagic.css' rel='stylesheet'>
		<link type='text/css' href='https://localhost/marktplaatstabel/excel-2007.css' rel='stylesheet'>
		<title>Marktplaatstabel</title>
	        <meta content="Marktplaatstabel - Marktplaats bedienen met excel!">
	</head>
	<body>
		<iframe id="myframe" src="https://localhost/syi/plaatsAdvertentie.html"></iframe>

		<div id="excelDiv">
			<div class="headerRight">
				<img id="logo" src="/mpexcel-32x32.ico">
				<div class="title">Marktplaatstabel</div>
				<div class="topMenu"><a href="http://localhost/marktplaatstabel">Terug naar bestandsoverzicht</a></div>
			</div>
			<div id="headerBottom"></div>
			<div class="body">
				<div id="excelFile"><?php echo "C:\Users\Public\Documents".$upload_dir.$_GET["file"]; ?></div>
				<div id="excelFileHeader">Excel sheet: <b><?php echo $_GET["file"]; ?></b></div>
                                <div id="help">
					<div id="activeXError"><?php require('ActiveXError.php'); ?></div>
					<div id="browserNotSupported">
						<div class="errorMessage">Voor deze toepassing kunt u alleen Internet Explorer gebruiken.</div>
					</div>
					<div id="fileNotFound">
						<div class="errorMessage">Bestand niet gevonden: </div>
					</div>
					<div id="unknown">
						<div class="errorMessage"></div>
					</div>
				</div>
				<div id="nrofrecords"></div>
                                <table class="ExcelTable2007">
					<tbody>
						<tr><th class="heading">&nbsp;</th><th>A</th><th>B</th></tr>
						<tr><td class="heading">1</td><td><b>Titel</b></td><td><b>Rubriek</b></td></tr>
					</tbody>
				</table>
			</div>
		</div>

	</body>

<?php } else { /* HTTP://LOCALHOST RESPONSIVE FILE MANAGER UPLOAD */ ?>

	<head>
		<title>Marktplaatstabel</title>
	        <meta content="Marktplaatstabel - Marktplaats bedienen met excel!"></meta>
		<script type='text/javascript' src='http://localhost/marktplaatstabel/jquery-2.1.1.js'></script> 
		<link type='text/css' href='http://localhost/marktplaatstabel/marktplaatsmagic.css' rel='stylesheet'>
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
