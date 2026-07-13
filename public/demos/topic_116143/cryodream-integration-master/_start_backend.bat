@echo off
cd /d G:\ice-project\comfyUI-draw-flow\service
call mvnw.cmd spring-boot:run > backend.log 2>&1
