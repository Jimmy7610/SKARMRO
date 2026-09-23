# SKÄRMRO — Integritetsprinciper (utkast)

SKÄRMRO är byggt enligt principen **Boundary, not surveillance**.

Detta dokument beskriver produktens avsedda datamodell. Det är ett produktutkast och måste juridiskt granskas före offentlig försäljning.

## SKÄRMRO ska inte samla in

- tangenttryckningar
- skärminspelningar
- privata meddelanden
- lösenord
- kamera- eller mikrofoninnehåll
- fullständig tittarhistorik
- fullständig webbhistorik

## Lokal data

SKÄRMRO kan lokalt lagra:

- förälderns skyddsinställningar
- blockerade kanaler
- egna blockerade ord och fraser
- rutiner
- appregler
- tillfälliga overrides
- Policy Receipts
- anonyma räknare för filtreringskategorier

Policy Receipts ska beskriva **vad skyddet gjorde**, inte vad barnet tittade på.

Exempel:

- "Läggdags aktiverades"
- "Auto Protect blockerade en sökning i kategorin gambling"
- "Föräldern gav 15 minuter extra tid"

Inte:

- den exakta videotiteln
- exakt sökfras
- fullständig URL

## Cloud

Gate 0 använder ingen nödvändig SKÄRMRO-cloud för Browser Guard-policyerna.

Om framtida synk införs ska det vara tydligt opt-in/produktmotiverat och dataminimerat.

## Försäljning

Ingen offentlig release bör göras innan:

- slutlig datakartläggning är klar
- faktisk telemetry är dokumenterad
- privacy policy matchar den körande produkten
- juridisk granskning är genomförd för målmarknaden
