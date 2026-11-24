# Generate Ludo Rush App Icons for Android (all mipmap densities) and Web
Add-Type -AssemblyName System.Drawing

$rootDir = Split-Path -Parent $PSScriptRoot
$resDir = Join-Path $rootDir "client\android\app\src\main\res"
$publicDir = Join-Path $rootDir "client\public"

$densities = @{
    "mipmap-mdpi"    = 48
    "mipmap-hdpi"    = 72
    "mipmap-xhdpi"   = 96
    "mipmap-xxhdpi"  = 144
    "mipmap-xxxhdpi" = 192
}

function Render-LudoIcon([int]$size, [bool]$isRound, [bool]$foregroundOnly) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

    $scale = $size / 512.0

    if (-not $foregroundOnly) {
        # 1. Dark Gaming Background
        $bgRect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
        $bgBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
            $bgRect,
            [System.Drawing.Color]::FromArgb(255, 15, 23, 42),
            [System.Drawing.Color]::FromArgb(255, 3, 7, 18),
            45.0
        )
        
        if ($isRound) {
            $g.FillEllipse($bgBrush, 0, 0, $size, $size)
            $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(200, 34, 211, 238), [Math]::Max(1.5, 4.0 * $scale))
            $g.DrawEllipse($borderPen, (2.0 * $scale), (2.0 * $scale), ($size - 4.0 * $scale), ($size - 4.0 * $scale))
        } else {
            # Rounded Squircle
            $radius = 100.0 * $scale
            $path = New-Object System.Drawing.Drawing2D.GraphicsPath
            $x = 4.0 * $scale
            $y = 4.0 * $scale
            $w = $size - 8.0 * $scale
            $h = $size - 8.0 * $scale
            $path.AddArc($x, $y, $radius, $radius, 180, 90)
            $path.AddArc($x + $w - $radius, $y, $radius, $radius, 270, 90)
            $path.AddArc($x + $w - $radius, $y + $h - $radius, $radius, $radius, 0, 90)
            $path.AddArc($x, $y + $h - $radius, $radius, $radius, 90, 90)
            $path.CloseFigure()
            $g.FillPath($bgBrush, $path)

            $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(220, 34, 211, 238), [Math]::Max(1.5, 5.0 * $scale))
            $g.DrawPath($borderPen, $path)
        }
    }

    # 2. Four Ludo Corner Gem Accents
    $gemRadius = 24.0 * $scale
    $gemOffset = 80.0 * $scale

    # Red (Top-Left)
    $redBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 239, 68, 68))
    $g.FillEllipse($redBrush, $gemOffset - $gemRadius, $gemOffset - $gemRadius, $gemRadius * 2, $gemRadius * 2)

    # Green (Top-Right)
    $greenBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 16, 185, 129))
    $g.FillEllipse($greenBrush, ($size - $gemOffset - $gemRadius), $gemOffset - $gemRadius, $gemRadius * 2, $gemRadius * 2)

    # Blue (Bottom-Left)
    $blueBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 59, 130, 246))
    $g.FillEllipse($blueBrush, $gemOffset - $gemRadius, ($size - $gemOffset - $gemRadius), $gemRadius * 2, $gemRadius * 2)

    # Yellow (Bottom-Right)
    $yellowBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 245, 158, 11))
    $g.FillEllipse($yellowBrush, ($size - $gemOffset - $gemRadius), ($size - $gemOffset - $gemRadius), $gemRadius * 2, $gemRadius * 2)

    # 3. Center Glowing Cyan Ambient Ring
    $centerHaloBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(35, 34, 211, 238))
    $haloSize = 270.0 * $scale
    $g.FillEllipse($centerHaloBrush, ($size/2.0 - $haloSize/2.0), ($size/2.0 - $haloSize/2.0), $haloSize, $haloSize)

    # 4. Isometric 3D Gaming Dice
    # Top Face
    $pTop1 = New-Object System.Drawing.PointF (256.0 * $scale), (130.0 * $scale)
    $pTop2 = New-Object System.Drawing.PointF (366.0 * $scale), (192.0 * $scale)
    $pTop3 = New-Object System.Drawing.PointF (256.0 * $scale), (254.0 * $scale)
    $pTop4 = New-Object System.Drawing.PointF (146.0 * $scale), (192.0 * $scale)
    $topFaceBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 56, 189, 248))
    $g.FillPolygon($topFaceBrush, @($pTop1, $pTop2, $pTop3, $pTop4))

    # Left Face
    $pLeft1 = New-Object System.Drawing.PointF (146.0 * $scale), (192.0 * $scale)
    $pLeft2 = New-Object System.Drawing.PointF (256.0 * $scale), (254.0 * $scale)
    $pLeft3 = New-Object System.Drawing.PointF (256.0 * $scale), (374.0 * $scale)
    $pLeft4 = New-Object System.Drawing.PointF (146.0 * $scale), (312.0 * $scale)
    $leftFaceBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 2, 132, 199))
    $g.FillPolygon($leftFaceBrush, @($pLeft1, $pLeft2, $pLeft3, $pLeft4))

    # Right Face
    $pRight1 = New-Object System.Drawing.PointF (256.0 * $scale), (254.0 * $scale)
    $pRight2 = New-Object System.Drawing.PointF (366.0 * $scale), (192.0 * $scale)
    $pRight3 = New-Object System.Drawing.PointF (366.0 * $scale), (312.0 * $scale)
    $pRight4 = New-Object System.Drawing.PointF (256.0 * $scale), (374.0 * $scale)
    $rightFaceBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 3, 105, 161))
    $g.FillPolygon($rightFaceBrush, @($pRight1, $pRight2, $pRight3, $pRight4))

    # Dice Edge Highlight Pen
    $dicePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(180, 255, 255, 255), [Math]::Max(1.0, 2.5 * $scale))
    $g.DrawPolygon($dicePen, @($pTop1, $pTop2, $pTop3, $pTop4))
    $g.DrawPolygon($dicePen, @($pLeft1, $pLeft2, $pLeft3, $pLeft4))
    $g.DrawPolygon($dicePen, @($pRight1, $pRight2, $pRight3, $pRight4))

    # Pips (White Dots) on Top Face (Center single pip)
    $pipWhite = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $g.FillEllipse($pipWhite, (256.0 * $scale - 10.0 * $scale), (192.0 * $scale - 6.0 * $scale), (20.0 * $scale), (12.0 * $scale))

    # Pips on Left Face (6 dots)
    $g.FillEllipse($pipWhite, (180.0 * $scale - 6.0 * $scale), (235.0 * $scale - 8.0 * $scale), (12.0 * $scale), (16.0 * $scale))
    $g.FillEllipse($pipWhite, (180.0 * $scale - 6.0 * $scale), (275.0 * $scale - 8.0 * $scale), (12.0 * $scale), (16.0 * $scale))
    $g.FillEllipse($pipWhite, (180.0 * $scale - 6.0 * $scale), (315.0 * $scale - 8.0 * $scale), (12.0 * $scale), (16.0 * $scale))
    $g.FillEllipse($pipWhite, (222.0 * $scale - 6.0 * $scale), (255.0 * $scale - 8.0 * $scale), (12.0 * $scale), (16.0 * $scale))
    $g.FillEllipse($pipWhite, (222.0 * $scale - 6.0 * $scale), (295.0 * $scale - 8.0 * $scale), (12.0 * $scale), (16.0 * $scale))
    $g.FillEllipse($pipWhite, (222.0 * $scale - 6.0 * $scale), (335.0 * $scale - 8.0 * $scale), (12.0 * $scale), (16.0 * $scale))

    # Pips on Right Face (4 dots)
    $g.FillEllipse($pipWhite, (290.0 * $scale - 6.0 * $scale), (255.0 * $scale - 8.0 * $scale), (12.0 * $scale), (16.0 * $scale))
    $g.FillEllipse($pipWhite, (290.0 * $scale - 6.0 * $scale), (335.0 * $scale - 8.0 * $scale), (12.0 * $scale), (16.0 * $scale))
    $g.FillEllipse($pipWhite, (332.0 * $scale - 6.0 * $scale), (235.0 * $scale - 8.0 * $scale), (12.0 * $scale), (16.0 * $scale))
    $g.FillEllipse($pipWhite, (332.0 * $scale - 6.0 * $scale), (315.0 * $scale - 8.0 * $scale), (12.0 * $scale), (16.0 * $scale))

    # Golden Crown on top apex
    $goldBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 251, 191, 36))
    $c1 = New-Object System.Drawing.PointF (220.0 * $scale), (135.0 * $scale)
    $c2 = New-Object System.Drawing.PointF (238.0 * $scale), (108.0 * $scale)
    $c3 = New-Object System.Drawing.PointF (256.0 * $scale), (125.0 * $scale)
    $c4 = New-Object System.Drawing.PointF (274.0 * $scale), (108.0 * $scale)
    $c5 = New-Object System.Drawing.PointF (292.0 * $scale), (135.0 * $scale)
    $g.FillPolygon($goldBrush, @($c1, $c2, $c3, $c4, $c5))

    $g.Dispose()
    return $bmp
}

Write-Host "🎨 Generating Ludo Rush Android launcher icons across all densities..."

foreach ($density in $densities.Keys) {
    $dim = $densities[$density]
    $dir = Join-Path $resDir $density
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    # 1. Standard Squircle Icon
    $icon = Render-LudoIcon -size $dim -isRound $false -foregroundOnly $false
    $icon.Save((Join-Path $dir "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $icon.Dispose()

    # 2. Round Icon
    $roundIcon = Render-LudoIcon -size $dim -isRound $true -foregroundOnly $false
    $roundIcon.Save((Join-Path $dir "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $roundIcon.Dispose()

    # 3. Foreground Icon
    $fgIcon = Render-LudoIcon -size $dim -isRound $false -foregroundOnly $true
    $fgIcon.Save((Join-Path $dir "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $fgIcon.Dispose()

    Write-Host "  ✓ Generated for $density (${dim}x${dim}px)"
}

# 4. Generate 512x512 High-Res Icon for Store / Web
$highRes = Render-LudoIcon -size 512 -isRound $false -foregroundOnly $false
$highRes.Save((Join-Path $publicDir "icon-512.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$highRes.Save((Join-Path $publicDir "apple-touch-icon.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$highRes.Dispose()
Write-Host "  ✓ Generated 512x512 Master icon in client/public/"

Write-Host "✅ All Ludo Rush app icons generated successfully!"
