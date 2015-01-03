(function($){

        var extensionsMap = {
                      ".zip" : "fa-file-archive-o",         
                      ".gz" : "fa-file-archive-o",         
                      ".bz2" : "fa-file-archive-o",         
                      ".xz" : "fa-file-archive-o",         
                      ".rar" : "fa-file-archive-o",         
                      ".tar" : "fa-file-archive-o",         
                      ".tgz" : "fa-file-archive-o",         
                      ".tbz2" : "fa-file-archive-o",         
                      ".z" : "fa-file-archive-o",         
                      ".7z" : "fa-file-archive-o",         
                      ".mp3" : "fa-file-audio-o",         
                      ".cs" : "fa-file-code-o",         
                      ".c++" : "fa-file-code-o",         
                      ".cpp" : "fa-file-code-o",         
                      ".js" : "fa-file-code-o",         
                      ".xls" : "fa-file-excel-o",         
                      ".xlsx" : "fa-file-excel-o",         
                      ".xlsm" : "fa-file-excel-o",         
                      ".xlsb" : "fa-file-excel-o",         
                      ".xml" : "fa-file-code-o",         
                      ".png" : "fa-file-image-o",         
                      ".jpg" : "fa-file-image-o",         
                      ".jpeg" : "fa-file-image-o",         
                      ".gif" : "fa-file-image-o",         
                      ".mpeg" : "fa-file-movie-o",         
                      ".pdf" : "fa-file-pdf-o",         
                      ".ppt" : "fa-file-powerpoint-o",         
                      ".pptx" : "fa-file-powerpoint-o",         
                      ".txt" : "fa-file-text-o",         
                      ".log" : "fa-file-text-o",         
                      ".doc" : "fa-file-word-o",        
                      ".docx" : "fa-file-word-o",        
                    };

  function getFileIcon(ext) {
    return ( ext && extensionsMap[ext.toLowerCase()]) || 'fa-file-o';
  }

  var documentURL = $('<a>', { href: document.URL} )[0];
  var path = documentURL.search.replace("?", "").replace("=","").replace(/\+/g,"");
  var rootFolder = decodeURIComponent(path.replace(/.*folder/, ""));

  function getDirList(e, path) {

      var query = '/getdirlist';
      if (typeof(path)!=='undefined') query+='?path='+ path;

      $.get(query).then(function(data){
	   table.fnClearTable();
	   $(".dataTables_scrollHead table.linksholder tr th.head0").html('<div>'+rootFolder+data.queryPath+'</div>');
	   table.fnAddData(data.folderContents);
	   setTableRowOnClickHandler();
      });
      if (typeof(e) !== 'undefined')
          e.preventDefault();
  }

   var options = {
	"scrollY":     395,
        "ordering":    false,
        "bProcessing": true,
        "bServerSide": false,
        "bPaginate":   false,
        "bAutoWidth":  false,
	"oLanguage":   {"sSearch": " Search: "},
	"fnDrawCallback": function() {
		        // Add backbutton
			var path = $('.dataTables_scrollBody table.linksholder thead tr:first').text();
			if (path!==rootFolder) {
				var newRow = '<tr role="row" class="odd"><td class=" head0"><a href="#"><i class="fa fa-arrow-left"></i><b>&nbsp;Terug</b></a></td></tr>';
				$('.dataTables_scrollBody table.linksholder thead').append(newRow);
				$('.dataTables_scrollBody table.linksholder thead tr:last').bind("click", 
					function(e) {

						var p=path.substring(rootFolder.length);

						var indexOfLastSeparator = p.lastIndexOf('\\');
                                                if (indexOfLastSeparator===-1)
						    indexOfLastSeparator = p.lastIndexOf('/');

						var previousFolder = '';
						if (indexOfLastSeparator > 0) {
							previousFolder = p.substring(1,indexOfLastSeparator);
						}
						getDirList(e, previousFolder);
					});
			}
	},
        "fnCreatedRow" :  function( nRow, aData, iDataIndex ) {
            if (!aData.IsDirectory) return;
	    var path = aData.Path;
            $(nRow).bind("click", function(e) {
	  	  getDirList(e, path);
            });
        }, 
        "aoColumns": [
          { 
	    "sTitle"    : rootFolder, 
            "mData"     : null, 
            "bSortable" : false, 
            "sClass"    : "head0",
            "render"    : function (data, type, row, meta) {
                if (data.IsDirectory) {
                    return "<a href='#'><i class='fa fa-folder'></i>&nbsp;" + data.Name +"</a>";
                } else {
                   return "<a href='" + data.Path + "'><i class='fa " + getFileIcon(data.Ext) + "'></i>&nbsp;" + data.Name +"</a>";
                }
            }
          }
        ]
   };

  var table = $(".linksholder").dataTable(options);

  getDirList();
  
  function setTableRowOnClickHandler() {
      $("table.dataTable tr td a").each(function(ix,el) {
	    // isFile = not a folder or left arrow
            var isFile = !$(this).children().first().is('.fa-folder, .fa-arrow-left');
            if (isFile)
                $(this).click(function(e) {
                    e.preventDefault();
                    window.parent.location = $(this).prop('href');
                });
      });
  }

})(jQuery);
