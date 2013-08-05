@echo off

cd /d %~dp0

set /p FtpLogin=Login:
set /p FtpPwd=Password:

echo user %FtpLogin%> ftpcmd.dat
echo %FtpPwd%>> ftpcmd.dat
echo bin>> ftpcmd.dat

echo cd /site/wwwroot/wp-content/BlingPoint/>>ftpcmd.dat
echo put "%~dp0dist\0.0.1\BlingPoint.js">> ftpcmd.dat
echo put "%~dp0dist\0.0.1\BlingPoint.min.js">> ftpcmd.dat

echo mkdir BlackbirdJs>>ftpcmd.dat
echo cd BlackbirdJs>>ftpcmd.dat
echo put "%~dp0dist\0.0.1\BlackbirdJs\Blackbird.css">> ftpcmd.dat
echo put "%~dp0dist\0.0.1\BlackbirdJs\Blackbird.min.css">> ftpcmd.dat
echo put "%~dp0dist\0.0.1\BlackbirdJs\blackbird_icons.png">> ftpcmd.dat
echo put "%~dp0dist\0.0.1\BlackbirdJs\blackbird_panel.png">> ftpcmd.dat

echo quit>> ftpcmd.dat
ftp -n -s:ftpcmd.dat waws-prod-am2-001.ftp.azurewebsites.windows.net
del ftpcmd.dat