# 创建src目录（如果不存在）
if (-not (Test-Path "src")) {
    New-Item -ItemType Directory -Path "src" -Force | Out-Null
}

# 复制pages目录
if (Test-Path "pages") {
    Copy-Item -Path "pages" -Destination "src\pages" -Recurse -Force
    Write-Host "已复制 pages 目录"
}

# 复制static目录
if (Test-Path "static") {
    Copy-Item -Path "static" -Destination "src\static" -Recurse -Force
    Write-Host "已复制 static 目录"
}

# 复制utils目录
if (Test-Path "utils") {
    Copy-Item -Path "utils" -Destination "src\utils" -Recurse -Force
    Write-Host "已复制 utils 目录"
}

Write-Host "文件结构调整完成！现在可以运行 npm run dev:mp-weixin"
