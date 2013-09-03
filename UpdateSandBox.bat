@echo off

cd /d %~dp0

xcopy /y /e .\dist\0.0.1\*.* .\SandBoxSolution\BlingPointAssets\