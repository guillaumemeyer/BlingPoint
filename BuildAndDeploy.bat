@echo off

cd /d %~dp0

call grunt build
call FtpUpload

echo "Press any key to continue..."
pause > nul
