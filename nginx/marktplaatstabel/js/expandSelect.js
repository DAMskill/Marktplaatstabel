
$(window).load(function() {

	if (localStorage.getItem("expanded") !== null) {
		localStorage.expanded = (localStorage.getItem("expanded")==="0" ? "1" : "0");
		toggleSelect();
	}
	if ($("div.syi-container").length > 0) {
		$("div.syi-container h3.section-header:eq(1)").append('<a style="font-size:13px;margin-left:10px;" href="#"" onclick="toggleSelect();return false;"><span>Alle keuzelijsten in/uitklappen</span></a>');
	}
});

function toggleSelect() {

	if (localStorage.getItem("expanded") === null || localStorage.getItem("expanded")==="0") {
		$('div.syi-container div.attribute').css('height','auto');
		$('div.syi-container div.attribute div.form-field').css('margin-bottom','10px');
		$('.dropdown ul').css({'position':'static','display':'block'});
		localStorage.expanded = "1";
	}
	else {
		$('div.syi-container div.attribute').css('height','');
		$('div.syi-container div.attribute div.form-field').css('margin-bottom','');
		$('.dropdown ul').css({'position':'','display':''});
		localStorage.expanded = "0";
	}
}

