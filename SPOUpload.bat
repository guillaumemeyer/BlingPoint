@echo off

cd /d %~dp0

set /p SPOLogin=Login:
set /p SPOPwd=Password:

SPODeployment\BlingPointDeployment\bin\Release\BlingPointDeployment.exe SandBoxSolution\bin\Release\BlingPointSandBox.wsp https://institutsharepoint.sharepoint.com/sites/DevGME/ %SPOLogin% %SPOPwd% 