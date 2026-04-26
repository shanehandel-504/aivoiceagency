# test-ghl-read.ps1
# Read-only GHL API test harness. No mutations.

# --- 1. Locate repo root and .env ---
$repoRoot = Split-Path (Split-Path $PSScriptRoot)
$envFile  = Join-Path $repoRoot ".env"

if (-not (Test-Path $envFile)) {
    Write-Error ".env not found at $repoRoot`nCopy .env.example to repo root and fill in your values."
    exit 1
}

# --- 2. Parse .env ---
# Skips blank lines and comment lines (#). Splits on first =. Strips surrounding quotes.
Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line -eq "" -or $line.StartsWith("#")) { return }
    $sep = $line.IndexOf("=")
    if ($sep -lt 1) { return }
    $key = $line.Substring(0, $sep).Trim()
    $val = $line.Substring($sep + 1).Trim().Trim('"').Trim("'")
    [System.Environment]::SetEnvironmentVariable($key, $val, "Process")
}

# --- 3. Validate required vars ---
$required = @("GHL_PRIVATE_TOKEN", "GHL_LOCATION_ID", "GHL_API_BASE")
$missing  = $required | Where-Object { -not [System.Environment]::GetEnvironmentVariable($_) }
if ($missing) {
    Write-Error "Missing required env vars: $($missing -join ', ')"
    exit 1
}

$base       = $env:GHL_API_BASE
$locationId = $env:GHL_LOCATION_ID
$headers    = @{
    "Authorization" = "Bearer $env:GHL_PRIVATE_TOKEN"
    "Version"       = "2021-07-28"
    "Content-Type"  = "application/json"
}

# --- 4. Helper: GET and print status + record count only. Never prints token. ---
function Invoke-GHLGet {
    param([string]$Label, [string]$Url)
    try {
        $resp  = Invoke-RestMethod -Uri $Url -Headers $headers -Method Get -ErrorAction Stop
        # Count the first array-valued property found in the response
        $count = ($resp.PSObject.Properties |
                  Where-Object { $_.Value -is [System.Array] } |
                  Select-Object -First 1).Value.Count
        if ($null -eq $count) { $count = "?" }
        Write-Host "[200] $Label — $count record(s)"
        return 200
    } catch {
        $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { -1 }
        Write-Host "[$code] $Label"
        return $code
    }
}

Write-Host "`n=== GHL Read-Only Test ===`n"

# Contacts
Invoke-GHLGet "GET /contacts"   "$base/contacts/?locationId=$locationId&limit=5"

# Calendars
Invoke-GHLGet "GET /calendars"  "$base/calendars/?locationId=$locationId"

# Opportunities — location_id primary, locationId fallback
$oppCode = Invoke-GHLGet "GET /opportunities/search (location_id)" "$base/opportunities/search?location_id=$locationId&limit=5"
if ($oppCode -eq 200) {
    Write-Host "  -> location_id param succeeded"
} else {
    Write-Host "  -> Falling back to locationId param..."
    $oppCode2 = Invoke-GHLGet "GET /opportunities/search (locationId)" "$base/opportunities/search?locationId=$locationId&limit=5"
    if ($oppCode2 -eq 200) {
        Write-Host "  -> locationId param succeeded"
    } else {
        Write-Host "  -> Both opportunity param variants failed (primary=$oppCode, fallback=$oppCode2)"
    }
}

# Tags
Invoke-GHLGet "GET /tags"       "$base/tags?locationId=$locationId"

Write-Host "`n=== Done ==="
Write-Host "401 = token missing or expired"
Write-Host "403 = token valid but lacks permission for this endpoint"
Write-Host "422 = wrong param name or value format"
