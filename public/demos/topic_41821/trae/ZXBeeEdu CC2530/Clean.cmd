
::打开回显
@echo on

::删除*.dep文件
::del=/s /a /f "*.dep"

::删除"settings" "Exe" "List" "Obj"文件夹
for /f "delims=" %%i in ('dir /ad /b /s "settings" "Exe" "List" "Obj"') do (
   rd /s /q "%%i"
)

::删除空文件夹
for /f "tokens=*" %%i in ('dir/s/b/ad^|sort /r') do rd "%%i"

exit