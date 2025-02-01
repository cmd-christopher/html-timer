# Clinic Timer

This is an HTML-based application designed to help outpatient clinicians time their telemedicine patient encounters. It also calculates the appropriate level of visit for new or established patients based on time-based visit coding.

## Features

-   **Timer Functionality:** Start, pause, and reset timers for each patient encounter.
-   **Visit Level Calculation:** Automatically calculates the visit level for new and established patients based on the elapsed time.
-   **Phone Visit Support:** Includes a specific timer for phone visits with different time-based coding. Include the word phone in the timer name to activate this feature.
-   **Drag and Drop:** Timers can be reordered using drag and drop after first pressing the "reorder" button
-   **Persistent Data:** Timers and their states are saved in local storage, so they persist across browser sessions.
-   **Customizable Timers:** Add new timers with custom names.
-   **Reset All:** Reset all timers to zero.
-   **Delete Timers:** Delete individual timers.

## How to Use

1.  Open the `index.html` file in your web browser.
2.  Click the play button (▶️) to start a timer.
3.  Click the pause button (⏸) to pause a timer.
4.  Click the reset button (↺) to reset a timer to zero.
5.  Click the trash button (🗑) to delete a timer.
6.  Click the "+" button to add a new timer.
7.  Click "Reset All" to reset all timers to zero.
8.  Drag and drop timers to reorder them.
9.  The visit level for new and established patients is displayed next to each timer.
10. The 99417 extended code is displayed when the time exceeds the threshold.

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

The 99417 extended code is displayed when the time exceeds the threshold for new and established patients. The threshold is 75 minutes for new patients and 55 minutes for established patients. The code is displayed as "99417 x N" where N is the number of 15-minute increments over the threshold.

## Technologies Used

-   HTML
-   CSS
-   JavaScript
-   React
-   Babel

## License

This project is licensed under the MIT License.

<img width="711" alt="Screenshot 2025-01-04 at 5 54 11 PM" src="https://github.com/user-attachments/assets/c3c92802-ca69-446b-8235-bb01537c4093" />
