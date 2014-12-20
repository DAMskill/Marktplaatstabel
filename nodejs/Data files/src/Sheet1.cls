VERSION 1.0 CLASS
BEGIN
  MultiUse = -1  'True
END
Attribute VB_Name = "Sheet1"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = False
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = True

Public Sub setHyperlink(ByVal row As Integer, ByVal column As Integer, ByVal link As String)
    ActiveSheet.Hyperlinks.Add Anchor:=ActiveSheet.Cells(row, column), Address:="", SubAddress:=link, TextToDisplay:=VOEG_FOTO_TOE_COLUMN_NAME
End Sub

Function getColumnLetter(ByVal Target As Range) As String
    getColumnLetter = Split(Target.Address(1, 0), "$")(0)
End Function


Public Sub Worksheet_FollowHyperlink(ByVal Target As Hyperlink)

    Dim nrOfLastRow As Integer
    Dim i As Integer
    Dim voegFotoToeColumn As Long
    Dim columnLetter As String
    
    voegFotoToeColumn = findColumnNumberByNameInActiveSheet(VOEG_FOTO_TOE_COLUMN_NAME)
    nrOfLastRow = Cells.Find("*", [A1], , , xlByRows, xlPrevious).row

    If (Target.Parent.column <> voegFotoToeColumn) Then
        Exit Sub
    End If
    
    columnLetter = getColumnLetter(Target.Parent)

    ' If the link of the cell is not pointing to itself
    If (ActiveCell.column <> Target.Parent.column Or ActiveCell.row <> Target.Parent.row) Then
        ' Change the link of the cell to itself
        Call setHyperlink(Target.Parent.row, voegFotoToeColumn, "'" + ActiveSheet.Name + "'!" + columnLetter + CStr(Target.Parent.row))
        ' Move back to the cell's position
        Cells(Target.Parent.row, Target.Parent.column).Select
    End If

    ' First header row of 'Voeg foto toe' column sets and fixes all hyperlinks below
    If (Target.Parent.column = voegFotoToeColumn And Target.Parent.row = 1) Then
        For i = 2 To nrOfLastRow
            Application.StatusBar = String(i, ChrW(9609))
            ' Point the cell to itself
            Call setHyperlink(i, voegFotoToeColumn, "'" + ActiveSheet.Name + "'!" + columnLetter + CStr(i))
        Next i
    
        Application.StatusBar = "VOEG FOTO TOE LINKS HERSTELD"
        Application.OnTime Now + TimeSerial(0, 0, 10), "ClearStatusBar"
    Else
        selectFileDialog
    End If
End Sub
