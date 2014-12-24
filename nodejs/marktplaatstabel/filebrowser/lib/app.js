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
  var path = documentURL.search.replace("?", "").replace("=","/").replace(/\+/g,"");
  var rootFolder = decodeURIComponent(path.replace(/.*folder\//, ""));

   var currentPath = null;
   var options = {
        "ordering":    false,
        "bProcessing": true,
        "bServerSide": false,
        "bPaginate":   false,
        "bAutoWidth":  false,
        "sScrollY":    "250px",
        "fnCreatedRow" :  function( nRow, aData, iDataIndex ) {
          if (!aData.IsDirectory) return;
          var path = aData.Path;

          $(nRow).bind("click", function(e) {

              $.get('/getdirlist?path='+ path).then(function(data){
                   table.fnClearTable();
                   table.fnAddData(data);
                   if (path) path="\\"+path;
                   $("div.dataTables_scrollHead table.dataTable tr th").text(rootFolder+path);
                   currentPath = path;
              });
              e.preventDefault();
          });
        }, 
        "aoColumns": [
          { "sTitle": rootFolder, "mData": null, "bSortable": false, "sClass": "head0", "sWidth": "55px",
            "render": function (data, type, row, meta) {
              if (data.IsBackButton) {
                return "<a href='#'><i class='fa fa-arrow-left'></i><b>&nbsp;" + data.Name +"</b></a>";
              }
              else if (data.IsDirectory) {
                return "<a href='#'><i class='fa fa-folder'></i>&nbsp;" + data.Name +"</a>";
              } else {
                return "<a href='" + data.Path + "' target='_blank'><i class='fa " + getFileIcon(data.Ext) + "'></i>&nbsp;" + data.Name +"</a>";
              }
            }
          }
        ]
   };

  var table = $(".linksholder").dataTable(options);

  $.get('/getdirlist').then(function(data){
      table.fnClearTable();
      table.fnAddData(data);
      setTableRowOnClickHandler();
  });

  function setTableRowOnClickHandler() {
      $("table.dataTable tr td a").each(function(ix,el) {
            var isFile = $(this).children().first().hasClass("fa-file-o");
            if (isFile)
                $(this).click(function(e) {
                    e.preventDefault();
                    window.parent.location = $(this).prop('href');
                });
      });
  }

})(jQuery);
