param(
    [string]$ChildUser = "SkarmroChild"
)

$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Run PowerShell as Administrator."
}

if (Get-LocalUser -Name $ChildUser -ErrorAction SilentlyContinue) {
    Write-Host "User '$ChildUser' already exists. No change made." -ForegroundColor Yellow
} else {
    $Password = Read-Host "Choose a password for the child account" -AsSecureString
    New-LocalUser `
        -Name $ChildUser `
        -Password $Password `
        -Description "SKARMRO protected child account" `
        -PasswordNeverExpires:$true `
        -UserMayNotChangePassword:$false

    Add-LocalGroupMember -Group "Users" -Member $ChildUser -ErrorAction SilentlyContinue
    Write-Host "Created standard user '$ChildUser'." -ForegroundColor Green
}

try {
    Remove-LocalGroupMember -Group "Administrators" -Member $ChildUser -ErrorAction Stop
    Write-Host "Removed '$ChildUser' from Administrators." -ForegroundColor Green
}
catch {
    Write-Host "'$ChildUser' is not in Administrators (good)." -ForegroundColor Green
}

Write-Host ""
Write-Host "Verification:" -ForegroundColor Cyan
Get-LocalUser -Name $ChildUser | Format-List Name, Enabled, Description
Write-Host ""
Get-LocalGroupMember -Group "Administrators" | Select-Object Name | Format-Table -AutoSize
