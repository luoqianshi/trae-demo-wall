Set shell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

baseDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectDir = fso.BuildPath(baseDir, "desktop-pet-3d")
logDir = fso.BuildPath(projectDir, "logs")

If Not fso.FolderExists(logDir) Then
  fso.CreateFolder(logDir)
End If

electronCmd = fso.BuildPath(projectDir, "node_modules\.bin\electron.cmd")
command = "cmd /c cd /d """ & projectDir & """ && """ & electronCmd & """ . > """ & fso.BuildPath(logDir, "desktop-pet.log") & """ 2>&1"
shell.Run command, 0, False
