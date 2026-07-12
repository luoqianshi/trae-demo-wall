@echo off
chcp 65001 >nul
call pnpm install >nul 2>&1
call pnpm dev