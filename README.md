# Clinic Timer

This is an HTML-based application designed to help outpatient clinicians time their telemedicine patient encounters. It also calculates the appropriate level of visit for new or established patients based on time-based visit coding.

## Features

-   **Timer Functionality:** Start, pause, and reset timers for each patient encounter.
-   **Visit Level Calculation:** Automatically calculates the visit level for new and established patients based on the elapsed time.
-   **Phone Visit Support:** Includes a specific timer for phone visits with different time-based coding. Include the word `phone` in the timer name to activate this feature.
-   **Drag and Drop:** Timers can be reordered using drag and drop after first pressing the "Reorder" button.
-   **Persistent Data:** Timers and their states are saved in browser `localStorage`, so they persist across sessions.
-   **Keep Screen Awake:** Uses the native browser Screen Wake Lock API while any timer is actively running and releases it automatically when paused or reset.
-   **Customizable Timers:** Add new timers with custom names, reset individual timers, reset all timers, or delete timers with confirmation.

## How to Use

1.  Open `index.html` in your web browser (or visit your hosted URL).
2.  Click a timer card or its play/pause button to start or pause a timer.
3.  Click the reset button to reset a timer to zero.
4.  Click the trash button to delete a timer.
5.  Click the `+` button to add a new timer.
6.  Click "Reset All" to reset all timers to zero.
7.  Click "Reorder" and drag and drop timers to rearrange them.
8.  The visit level for new and established patients is displayed next to each timer.
9.  The `99417` extended code is displayed when the time exceeds the threshold.

## Synchronous Audio-Video Encounters

The application calculates the code for a synchronous audio-video encounter based on the following time-based coding:

### New Patient

- 0-14 minutes: 0 (No code)
- 15-29 minutes: 98000
- 30-44 minutes: 98001
- 45-59 minutes: 98002
- 60+ minutes: 98003

### Established Patient

- 0-9 minutes: 0 (No code)
- 10-19 minutes: 98004
- 20-29 minutes: 98005
- 30-39 minutes: 98006
- 40+ minutes: 98007

### Audio-Only (Phone) Telemedicine Encounters

#### Established Patient
- 0-9 minutes: 0 (No code)
- 10-19 minutes: 98012
- 20-29 minutes: 98013
- 30+ minutes: 98014

#### New Patient
- 0-14 minutes: 0 (No code)
- 15-29 minutes: 98009
- 30-44 minutes: 98010
- 45+ minutes: 98011

## 99417 Extended Code

The `99417` extended code is displayed when the time exceeds the threshold for new and established patients. The threshold is 75 minutes for new patients and 55 minutes for established patients. The code is displayed as `99417 x N` where `N` is the number of 15-minute increments over the threshold.

## Architecture & Security

-   **Zero JavaScript dependencies:** Built with vanilla HTML (`index.html`), CSS (`styles.css`), and JavaScript (`app.js`) with an inline SVG icon sprite—no CDN scripts, no in-browser transpiler, and no build step.
-   **HTTP Security Headers & Dotfile Protection:** Included in `.htaccess` for Apache (`mod_headers` + `mod_rewrite`), enforcing HSTS, a strict Content Security Policy (`script-src 'self'`, `require-trusted-types-for 'script'`, `frame-ancestors 'none'`), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, COOP/CORP, and denying HTTP access to `.git` and dotfiles.
-   **Optional Nginx defense-in-depth:** If proxied behind Nginx (e.g., Synology Web Station), you can also add a `user.conf` drop-in blocking dotfiles at the proxy layer:
    ```nginx
    location ~ /\.(?!well-known) {
        deny all;
        return 404;
    }
    ```

## License

This project is licensed under the MIT License.
