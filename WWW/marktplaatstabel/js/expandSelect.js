"use strict";

(function(){

    var checkForjQueryAndAddExpandSelect = setInterval(function() { addExpandSelect(); }, 1000);

    function addExpandSelect() {

        if (typeof $ !=='undefined')
        {
            clearInterval(checkForjQueryAndAddExpandSelect);

            var textElement = null;

            var setText = function() {
                    var inuit = localStorage.getItem("expanded")==="1" ? "in" : "uit";
                    var toggleText = 'Alle keuzelijsten '+inuit+'klappen';
                    $(textElement).text(toggleText);
            }

            var toggleSelect = function() {

                    if (localStorage.getItem("expanded")==="0") {
                            $('select').each(function(ix, el){
                                 if ($(el).parent().is(":visible"))
                                    $(el).attr('size', $("option", el).size());
                            });
                            localStorage.expanded = "1";
                    }
                    else {
                            $('select').each(function(ix, el){
                                $(el).removeAttr("size");
                            });
                            localStorage.expanded = "0";
                    }
                    setText();
            }

            if ($("#syi-form").length > 0) {

                var a = document.createElement('a');
                textElement = document.createElement('span');
                $(a).css({"font-size":"13px","margin-left":"70px","outline":"0"});
                $(a).append(textElement);
                $(a).click(function(){toggleSelect()});

                // Append toggle text container
                $("div.box-header h3.heading-3:eq(1)").append(a);

                if (localStorage.getItem("expanded") === null) {
                    localStorage.expanded = 0;
                    setText();
                }
                else {
                    // Restore previous setting on page load
                    localStorage.expanded = (localStorage.getItem("expanded")==="0" ? "1" : "0");
                    toggleSelect();
                }
            }
        }
    }

}());
