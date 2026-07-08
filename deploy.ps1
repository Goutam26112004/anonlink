$keyPath = "$env:USERPROFILE\.ssh\anonlink.key"
$host = "ubuntu@132.226.190.112"
$dir = "/home/ubuntu/anon-chat-platform"

Write-Host "==> Deploying to anonlink.online ..." -ForegroundColor Cyan

if (-not (Test-Path $keyPath)) {
    Write-Host "ERROR: SSH key not found at $keyPath" -ForegroundColor Red
    exit 1
}

$cmd = "cd $dir; git fetch origin main; git reset --hard origin/main; sudo docker-compose build 2>&1; sudo docker exec anon-chat-db psql -U anonuser -d anondb -c 'DELETE FROM friends;' 2>&1 || true; sudo docker-compose rm -fs 2>&1 || true; sudo docker-compose up -d 2>&1; sleep 10; sudo docker exec anon-chat-backend sh -c 'npx prisma db push --accept-data-loss' 2>&1 || true; sudo docker image prune -f 2>&1"

$result = ssh -i $keyPath -o StrictHostKeyChecking=no -o ConnectTimeout=15 $host $cmd 2>&1
$ok = $LASTEXITCODE -eq 0

$result | ForEach-Object { Write-Host $_ }

if (-not $ok) {
    Write-Host "FAILED (exit code: $LASTEXITCODE)" -ForegroundColor Red
} else {
    Write-Host "SUCCESS! https://anonlink.online" -ForegroundColor Green
}
