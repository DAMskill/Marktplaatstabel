Attribute VB_Name = "Module1"
Option Explicit
Public Const VOEG_FOTO_TOE_COLUMN_NAME As String = "Voeg foto toe"

Public Sub ClearStatusBar()
    Application.StatusBar = False
End Sub

Public Sub openDataFormWithoutWarnings()
    Application.DisplayAlerts = False
    ActiveSheet.ShowDataForm
    Application.DisplayAlerts = True
End Sub
Function findColumnNumberByNameInActiveSheet(columnName As Variant) As Long
    Dim R As Range
    
    Set R = ActiveSheet.Rows(1).Find(What:=Trim(columnName), LookIn:=xlValues, LookAt:=xlWhole, SearchOrder:=xlByRows, SearchDirection:=xlNext, MatchCase:=False, SearchFormat:=False)
    If Not R Is Nothing Then
        findColumnNumberByNameInActiveSheet = R.column
    End If
    
End Function
Public Sub selectFileDialog()
    Dim Pos As Long
    Dim Dialog As Office.FileDialog
    Set Dialog = Application.FileDialog(msoFileDialogFilePicker)

    Dim nextCell As Range
    Set nextCell = Cells(ActiveCell.row, ActiveCell.column + 1)
    
    Do While nextCell.Value <> ""
        Set nextCell = Cells(nextCell.row, nextCell.column + 1)
    Loop

    With Dialog
        .AllowMultiSelect = True
        .Filters.Clear
        .Filters.Add "Pictures", "*.jpg;*.png;*.gif", 1
        .Title = "Selecteer een afbeelding"
        .InitialView = msoFileDialogViewList
        .ButtonName = "Select"
        
        If .Show Then
            For Pos = 1 To .SelectedItems.Count
                nextCell.Value = .SelectedItems.Item(Pos) ' process each file
                nextCell.HorizontalAlignment = xlFill
                nextCell.HorizontalAlignment = xlRight
                Set nextCell = Cells(nextCell.row, nextCell.column + 1)
            Next
        End If
    End With
End Sub

Function FileExists(ByVal strFile As String, Optional bFindFolders As Boolean) As Boolean

    ' Purpose:   Return True if the file exists, even if it is hidden.
    ' Arguments: strFile: File name to look for. Current directory searched if no path included.
    '           bFindFolders. If strFile is a folder, FileExists() returns False unless this argument is True.
    ' Note:      Does not look inside subdirectories for the file.
    ' Author:    Allen Browne. http://allenbrowne.com June, 2006.
    ' Source URL: http://allenbrowne.com/func-11.html
    
    Dim lngAttributes As Long

    'Include read-only files, hidden files, system files.
    lngAttributes = (vbReadOnly Or vbHidden Or vbSystem)
    If bFindFolders Then
        lngAttributes = (lngAttributes Or vbDirectory) 'Include folders as well.
    Else
        'Strip any trailing slash, so Dir does not look inside the folder.
        Do While Right$(strFile, 1) = "\"
            strFile = Left$(strFile, Len(strFile) - 1)
        Loop
    End If
    'If Dir() returns something, the file exists.
    On Error Resume Next
    FileExists = (Len(Dir(strFile, lngAttributes)) > 0)
End Function
