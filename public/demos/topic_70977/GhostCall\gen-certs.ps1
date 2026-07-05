$cert = New-SelfSignedCertificate -DnsName 'localhost' -CertStoreLocation 'Cert:\CurrentUser\My' -NotAfter (Get-Date).AddYears(1) -KeyAlgorithm RSA -KeyLength 2048 -KeyExportPolicy Exportable

$certsDir = Join-Path $PSScriptRoot 'certs'

# Export cert as PEM
$certBase64 = [Convert]::ToBase64String($cert.RawData, [Base64FormattingOptions]::InsertLineBreaks)
$certPem = "-----BEGIN CERTIFICATE-----`n" + $certBase64 + "`n-----END CERTIFICATE-----"
[System.IO.File]::WriteAllText("$certsDir\cert.pem", $certPem, [System.Text.Encoding]::ASCII)

# Export private key as PEM using CngKey
$rsa = [System.Security.Cryptography.X509Certificates.RSACertificateExtensions]::GetRSAPrivateKey($cert)
$cngKey = $rsa.Key
$rawBytes = [byte[]]$cngKey.Export([System.Security.Cryptography.CngKeyBlobFormat]::Pkcs8PrivateBlob)
$privKeyB64 = [Convert]::ToBase64String($rawBytes, [Base64FormattingOptions]::InsertLineBreaks)
$keyPem = "-----BEGIN PRIVATE KEY-----`n" + $privKeyB64 + "`n-----END PRIVATE KEY-----"
[System.IO.File]::WriteAllText("$certsDir\key.pem", $keyPem, [System.Text.Encoding]::ASCII)

# Cleanup cert store
Remove-Item "Cert:\CurrentUser\My\$($cert.Thumbprint)" -ErrorAction SilentlyContinue

Write-Host 'CERTS_OK'
