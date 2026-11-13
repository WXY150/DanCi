param(
  [string]$Database = 'danci',
  [string]$BackupDir = '.\backups',
  [string]$ImageDir = '.\generated'
)

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
mysqldump --single-transaction $Database | Set-Content -Path (Join-Path $BackupDir "$Database-$stamp.sql") -Encoding utf8
tar -czf (Join-Path $BackupDir "generated-$stamp.tar.gz") $ImageDir
