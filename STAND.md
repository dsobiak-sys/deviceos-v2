# DeviceOS – Projektstand
Stand: 17. März 2026

## Was bisher gebaut wurde

- Prototype-App (deviceos-prototype-v2.html) mit 6 Screens:
  1. Login (Google/Microsoft SSO – noch simuliert)
  2. Home / Dashboard
  3. Gerät scannen (Kamera + Claude KI-Erkennung) ← hier sind wir
  4. Dokument signieren
  5. Erfolgs-Screen
  6. QR-Label drucken (Brother QL Drucker)

- Proxy-Server (server.js) – leitet API-Aufrufe an Claude weiter

## Was funktioniert

- Kamera öffnet sich auf Screen 3
- Foto wird aufgenommen und an Claude API gesendet
- KI erkennt Gerät (Typ, Marke, Modell)
- Seriennummer-Feld erscheint automatisch wenn nötig

## Nächster offener Punkt

- Claude API Key (sk-ant-api03-k46...oQAA) gibt 401 Fehler
- Wahrscheinlich kein Guthaben auf dem Anthropic Account
- → console.anthropic.com → Billing → Kreditkarte + min. $5 aufladen
- Danach sollte die KI-Erkennung sofort funktionieren

## Geplante nächste Schritte

1. KI-Erkennung testen (nach Billing-Setup)
2. Google Login einbauen (Firebase Authentication)
3. Scan-Daten in Google Tabelle speichern (Google Apps Script)
4. App online stellen (Vercel)

## Server starten

```bash
node /Users/daniel/Projekte/deviceos/server.js
```

Dann Browser öffnen: http://localhost:3000
