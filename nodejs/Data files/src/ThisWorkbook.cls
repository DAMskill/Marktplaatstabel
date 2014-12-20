VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "ThisWorkbook"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True
Private Sub Workbook_SheetChange(ByVal Sh As Object, ByVal Target As Range)
   
    Dim aCell As Range
    Dim voegFotoToeColumn As Long
    
    'This subroutine is slow, don't handle more than 1000 cells at once
    If Target.Count > 1000 Then
        Exit Sub
    End If
    
    On Error GoTo CleanUp
    Application.EnableEvents = False
    Application.ScreenUpdating = False
        
    voegFotoToeColumn = findColumnNumberByNameInActiveSheet("Voeg foto toe")
  
    If Target.column > voegFotoToeColumn Then

        ' For each cell after picture add column
        ' fill the comment background with the picture.
        For Each aCell In Target.Cells
        
            If (aCell.Value <> "" And FileExists(aCell.Value) = True) Then
            
                Dim cmt As Comment
                Set cmt = aCell.Comment
                
                If cmt Is Nothing Then
                   Set cmt = aCell.AddComment
                End If
    
                With cmt
                  .Text Text:=""
                  .Shape.Fill.UserPicture aCell.Value
                  .Shape.Width = 125
                  .Shape.Height = 125
                  .Visible = False
                End With

            Else
                aCell.ClearComments
            End If
    
        Next aCell

    End If
    
CleanUp:
    'Application.CalculateFull
    Application.EnableEvents = True
    Application.ScreenUpdating = True
End Sub
