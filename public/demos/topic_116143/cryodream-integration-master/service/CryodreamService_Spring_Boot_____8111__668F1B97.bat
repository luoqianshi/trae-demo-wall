@echo off
cd /d "G:\ice-project\comfyUI-draw-flow\service"
cmd /c "mvnw.cmd spring-boot:run -Dspring-boot.run.profiles=dev -Dspring-boot.run.arguments=--server.port=8111"
