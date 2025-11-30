# Notemate Backend Installation Verification

Write-Host "🔍 Notemate Backend - Installation Verification" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js version
Write-Host "Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Check npm version
Write-Host "Checking npm version..." -ForegroundColor Yellow
$npmVersion = npm --version
Write-Host "✓ npm: $npmVersion" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
Write-Host "Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
    
    # Check for required environment variables
    $envContent = Get-Content ".env" -Raw
    $requiredVars = @(
        "FIREBASE_PROJECT_ID",
        "FIREBASE_CLIENT_EMAIL",
        "FIREBASE_PRIVATE_KEY",
        "UPLOADTHING_TOKEN",
        "ASSEMBLYAI_API_KEY",
        "ASSEMBLYAI_WEBHOOK_SECRET",
        "GEMINI_API_KEY"
    )
    
    Write-Host "Checking required environment variables:" -ForegroundColor Yellow
    foreach ($var in $requiredVars) {
        if ($envContent -match "$var=.+") {
            Write-Host "  ✓ $var is set" -ForegroundColor Green
        } else {
            Write-Host "  ✗ $var is missing or empty" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✗ .env file not found" -ForegroundColor Red
    Write-Host "  Run: cp .env.example .env" -ForegroundColor Yellow
}
Write-Host ""

# Check if node_modules exists
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✓ node_modules directory exists" -ForegroundColor Green
    
    # Check for key dependencies
    $keyDeps = @(
        "node_modules/firebase-admin",
        "node_modules/assemblyai",
        "node_modules/@google",
        "node_modules/uploadthing",
        "node_modules/@nestjs"
    )
    
    Write-Host "Checking key dependencies:" -ForegroundColor Yellow
    foreach ($dep in $keyDeps) {
        if (Test-Path $dep) {
            $depName = Split-Path $dep -Leaf
            Write-Host "  ✓ $depName installed" -ForegroundColor Green
        } else {
            $depName = Split-Path $dep -Leaf
            Write-Host "  ✗ $depName not found" -ForegroundColor Red
        }
    }
} else {
    Write-Host "✗ node_modules not found" -ForegroundColor Red
    Write-Host "  Run: npm install" -ForegroundColor Yellow
}
Write-Host ""

# Check project structure
Write-Host "Checking project structure..." -ForegroundColor Yellow
$requiredDirs = @(
    "src/auth",
    "src/assemblyai",
    "src/chats",
    "src/config",
    "src/firestore",
    "src/gemini",
    "src/messages",
    "src/uploadthing",
    "src/webhook",
    "src/common"
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        $dirName = Split-Path $dir -Leaf
        Write-Host "  ✓ $dirName module exists" -ForegroundColor Green
    } else {
        Write-Host "  ✗ $dir not found" -ForegroundColor Red
    }
}
Write-Host ""

# Summary
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Verification Summary" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Install dependencies: npm install" -ForegroundColor White
Write-Host "2. Configure .env file with your credentials" -ForegroundColor White
Write-Host "3. Set up ngrok: ngrok http 3000" -ForegroundColor White
Write-Host "4. Update WEBHOOK_BASE_URL in .env" -ForegroundColor White
Write-Host "5. Start development server: npm run start:dev" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "  - SETUP-GUIDE.md - Quick start guide" -ForegroundColor White
Write-Host "  - NOTEMATE-README.md - Full documentation" -ForegroundColor White
Write-Host "  - PROJECT-OVERVIEW.md - Architecture details" -ForegroundColor White
Write-Host ""
