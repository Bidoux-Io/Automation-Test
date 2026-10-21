# Percept Cloud camera restoration

This Playwright script replays the visible camera-add workflow. It uses your existing browser login and does not require API tokens.

## Setup

```powershell
npm install
npx playwright install chromium
```

Set the Gateway Cameras page URL. For the Gateway from the HAR you provided:

```powershell
$env:GATEWAY_URL = 'https://qa.east-us.perceptcloud.net/f0590b6fd0e02bbef29ffde5/devices/691cd33dd5306168ee7c39f9/cameras'
```

Run one camera in dry-run mode first. The script stops on the final Add screen:

```powershell
npm run add-cameras -- 10.190.70.15
```

After reviewing the flow, apply the camera:

```powershell
$env:APPLY = '1'
npm run add-cameras -- 10.190.70.15
```

To process every usable CSV row, omit the IP argument. Set `CAMERA_CSV` if the CSV is somewhere else:

```powershell
$env:CAMERA_CSV = 'C:\path\to\cameras.csv'
npm run add-cameras
```

The first run opens a visible browser and pauses for interactive login. The login profile is kept locally in `.playwright-profile`. Do not commit that directory or the CSV; both can contain credentials and session data.

The script uses the first non-empty line of multiline username/password cells. Review those rows manually before applying them, because some devices have multiple possible accounts.
