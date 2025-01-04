# Clinic Timer

This is a simple HTML-based application designed to help outpatient clinicians time their patient encounters. It also calculates the appropriate level of visit for new or established patients based on time-based visit coding.

## Features

-   **Timer Functionality:** Start, pause, and reset timers for each patient encounter.
-   **Visit Level Calculation:** Automatically calculates the visit level for new and established patients based on the elapsed time.
-   **Phone Visit Support:** Includes a specific timer for phone visits with different time-based coding.
-   **Drag and Drop:** Timers can be reordered using drag and drop.
-   **Persistent Data:** Timers and their states are saved in local storage, so they persist across browser sessions.
-   **Customizable Timers:** Add new timers with custom names.
-   **Reset All:** Reset all timers to zero.
-   **Delete Timers:** Delete individual timers.

## How to Use

1.  Open the `clinic-timer-standalone.html` file in your web browser.
2.  Click the play button (▶️) to start a timer.
3.  Click the pause button (⏸) to pause a timer.
4.  Click the reset button (↺) to reset a timer to zero.
5.  Click the trash button (🗑) to delete a timer.
6.  Click the "+" button to add a new timer.
7.  Click "Reset All" to reset all timers to zero.
8.  Drag and drop timers to reorder them.
9.  The visit level for new and established patients is displayed next to each timer.
10. The 99417 extended code is displayed when the time exceeds the threshold.

## Visit Level Calculation

The application calculates the visit level based on the following time-based coding:

### New Patient

-   Level 1: Up to 20 minutes
-   Level 2: 21-30 minutes
-   Level 3: 31-45 minutes
-   Level 4: 46-60 minutes
-   Level 5: 61+ minutes

### Established Patient

-   Level 1: Up to 10 minutes
-   Level 2: 11-20 minutes
-   Level 3: 21-30 minutes
-   Level 4: 31-40 minutes
-   Level 5: 41+ minutes

### Phone Visit

-   Level 1: Up to 10 minutes
-   Level 2: 11-20 minutes
-   Level 3: 21+ minutes

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
