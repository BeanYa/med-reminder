@echo off
REM Production Environment Deployment Script (Windows)

setlocal enabledelayedexpansion

REM Default production configuration
set DEFAULT_PORT=3000
set DEFAULT_HOST=0.0.0.0
set DEFAULT_NAME=med-reminder-prod

REM Initialize variables
set PORT=%DEFAULT_PORT%
set HOST=%DEFAULT_HOST%
set CONTAINER_NAME=%DEFAULT_NAME%

REM Parse command line arguments
:parse_args
if "%~1"=="" goto start_deploy
if "%~1"=="-p" (
    set PORT=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--port" (
    set PORT=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="-H" (
    set HOST=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--host" (
    set HOST=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="-n" (
    set CONTAINER_NAME=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="--name" (
    set CONTAINER_NAME=%~2
    shift
    shift
    goto parse_args
)
if "%~1"=="-h" goto show_help
if "%~1"=="--help" goto show_help
echo Unknown parameter: %~1
echo Use -h or --help for help
pause
exit /b 1

:show_help
echo Usage: %0 [options]
echo Production Environment Deployment Script
echo.
echo Options:
echo   -p, --port PORT       Specify port number (default: %DEFAULT_PORT%)
echo   -H, --host HOST       Specify host address (default: %DEFAULT_HOST%)
echo   -n, --name NAME       Specify container name (default: %DEFAULT_NAME%)
echo   -h, --help           Show help information
echo.
echo Examples:
echo   %0 --port 80 --name production-med-app
echo   %0 -p 3000 -H 0.0.0.0
echo.
exit /b 0

:start_deploy
REM Validate port number
echo %PORT%| findstr /r "^[0-9][0-9]*$" >nul
if errorlevel 1 (
    echo Error: Port number must be numeric
    pause
    exit /b 1
)
if %PORT% leq 0 if %PORT% gtr 65535 (
    echo Error: Port number must be between 1-65535
    pause
    exit /b 1
)

echo === Production Environment Deployment Script ===
echo Port: %PORT%
echo Host: %HOST%
echo Container Name: %CONTAINER_NAME%
echo Environment: production
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed, please install Docker Desktop
    echo Download URL: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Clean up existing containers
echo.
echo Cleaning up existing containers...
docker-compose -f docker-compose.prod.yml down --remove-orphans 2>nul

REM Build and start
echo.
echo Building production image...
set PORT=%PORT% HOST=%HOST% NODE_ENV=production CONTAINER_NAME=%CONTAINER_NAME% docker-compose -f docker-compose.prod.yml build

echo.
echo Starting production service...
set PORT=%PORT% HOST=%HOST% NODE_ENV=production CONTAINER_NAME=%CONTAINER_NAME% docker-compose -f docker-compose.prod.yml up -d

REM Wait for service to start
echo.
echo Waiting for service to start...
timeout /t 10 /nobreak >nul

REM Health check
echo.
echo Checking service status...
curl -f http://localhost:%PORT%/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [SUCCESS] Production environment deployed successfully!
    echo.
    echo Access URL: http://localhost:%PORT%
    echo Container Name: %CONTAINER_NAME%
    echo.
    echo Management Commands:
    echo View logs: docker-compose -f docker-compose.prod.yml logs -f
    echo Stop service: docker-compose -f docker-compose.prod.yml down
    echo Restart service: docker-compose -f docker-compose.prod.yml restart
) else (
    echo [ERROR] Service failed to start, view logs:
    docker-compose -f docker-compose.prod.yml logs
    pause
    exit /b 1
)

echo.
echo === Production Environment Deployment Complete ===
pause