'use strict';

(() => {
    const STORAGE_KEY = 'timers';
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const DEFAULT_NAMES = [
        '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30',
        '1:00', '1:30', '2:00', '2:30', '3:00', '3:30', 'Phone',
    ];

    function generateId() {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
    }

    function createTimer(name) {
        return {
            id: generateId(),
            name: String(name),
            elapsedTime: 0,
            isRunning: false,
            isPaused: false,
            startTime: null,
        };
    }

    function createInitialTimers() {
        return DEFAULT_NAMES.map(createTimer);
    }

    function sanitizeTimer(raw) {
        if (!raw || typeof raw !== 'object') {
            return null;
        }
        const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name : null;
        if (!name) {
            return null;
        }
        const id = typeof raw.id === 'string' && raw.id ? raw.id : generateId();
        const isRunning = Boolean(raw.isRunning);
        const isPaused = isRunning ? Boolean(raw.isPaused) : false;
        const rawElapsed = Number(raw.elapsedTime);
        let elapsedTime = Number.isFinite(rawElapsed) && rawElapsed >= 0 ? Math.floor(rawElapsed) : 0;
        const rawStart = Number(raw.startTime);
        const startTime = Number.isFinite(rawStart) && rawStart > 0 ? rawStart : null;

        if (isRunning && !isPaused && startTime !== null) {
            elapsedTime = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
        }

        return { id, name, elapsedTime, isRunning, isPaused, startTime };
    }

    function loadTimers() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) {
                return createInitialTimers();
            }
            const parsed = JSON.parse(saved);
            if (!Array.isArray(parsed)) {
                return createInitialTimers();
            }
            const validated = parsed.map(sanitizeTimer).filter(Boolean);
            return validated.length > 0 ? validated : createInitialTimers();
        } catch {
            return createInitialTimers();
        }
    }

    function saveTimers(timers) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
        } catch {
            // Ignore storage quota or private-browsing errors
        }
    }

    function formatTime(seconds) {
        const safeSeconds = Math.max(0, Math.floor(seconds));
        const hours = Math.floor(safeSeconds / 3600);
        const minutes = Math.floor((safeSeconds % 3600) / 60);
        const remainingSeconds = safeSeconds % 60;

        if (hours > 0) {
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
        }
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    function getComplexityCode(timer, type) {
        const minutes = Math.floor(timer.elapsedTime / 60);
        const isPhone = timer.name.toLowerCase().includes('phone');

        if (isPhone) {
            if (type === 'EST') {
                if (minutes <= 9) return 0;
                if (minutes <= 19) return 98012;
                if (minutes <= 29) return 98013;
                return 98014;
            }
            if (minutes <= 14) return 0;
            if (minutes <= 29) return 98009;
            if (minutes <= 44) return 98010;
            return 98011;
        }

        if (type === 'EST') {
            if (minutes <= 9) return 0;
            if (minutes <= 19) return 98004;
            if (minutes <= 29) return 98005;
            if (minutes <= 39) return 98006;
            return 98007;
        }
        if (minutes <= 14) return 0;
        if (minutes <= 29) return 98000;
        if (minutes <= 44) return 98001;
        if (minutes <= 59) return 98002;
        return 98003;
    }

    function get99417Multiplier(timer, type) {
        const minutes = Math.floor(timer.elapsedTime / 60);
        const threshold = type === 'NEW' ? 75 : 55;
        if (minutes <= threshold) return 0;
        return Math.ceil((minutes - threshold) / 15);
    }

    function createSvgIcon(symbolId, size) {
        const svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('class', 'icon');
        svg.setAttribute('width', String(size));
        svg.setAttribute('height', String(size));
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');

        const use = document.createElementNS(SVG_NS, 'use');
        use.setAttribute('href', `#${symbolId}`);
        svg.appendChild(use);
        return svg;
    }

    // Native Screen Wake Lock API manager (replaces NoSleep.js)
    let wakeLockSentinel = null;

    function hasActiveTimer(timers) {
        return timers.some((timer) => timer.isRunning && !timer.isPaused);
    }

    async function syncWakeLock(timers) {
        if (!('wakeLock' in navigator) || !navigator.wakeLock) {
            return;
        }

        const shouldHold = hasActiveTimer(timers) && document.visibilityState === 'visible';

        if (shouldHold && !wakeLockSentinel) {
            try {
                const sentinel = await navigator.wakeLock.request('screen');
                wakeLockSentinel = sentinel;
                sentinel.addEventListener('release', () => {
                    if (wakeLockSentinel === sentinel) {
                        wakeLockSentinel = null;
                    }
                });
            } catch {
                // Browser may reject wake lock (low battery, unfocused tab, or policy)
            }
        } else if (!shouldHold && wakeLockSentinel) {
            try {
                const sentinel = wakeLockSentinel;
                wakeLockSentinel = null;
                await sentinel.release();
            } catch {
                // Ignore release errors
            }
        }
    }

    // Application state
    let timers = loadTimers();
    let isReorderMode = false;
    let pendingDeleteId = null;

    // DOM references
    const timerListEl = document.getElementById('timer-list');
    const resetAllBtn = document.getElementById('reset-all-btn');
    const reorderBtn = document.getElementById('reorder-btn');
    const addTimerBtn = document.getElementById('add-timer-btn');

    const addTimerDialog = document.getElementById('add-timer-dialog');
    const addTimerForm = document.getElementById('add-timer-form');
    const addTimerCancelBtn = document.getElementById('add-timer-cancel-btn');
    const timerNameInput = document.getElementById('timer-name-input');
    const resetAllDialog = document.getElementById('reset-all-dialog');
    const deleteTimerDialog = document.getElementById('delete-timer-dialog');

    // Light-dismiss fallback for browsers without <dialog closedby="any"> (e.g., Safari)
    if (!('closedBy' in HTMLDialogElement.prototype)) {
        const isOutside = (event, dialog) => {
            const rect = dialog.getBoundingClientRect();
            return (
                event.clientX < rect.left ||
                event.clientX > rect.right ||
                event.clientY < rect.top ||
                event.clientY > rect.bottom
            );
        };

        document.querySelectorAll('dialog[closedby="any"]').forEach((dialog) => {
            let pressedOutside = false;
            dialog.addEventListener('pointerdown', (event) => {
                pressedOutside = isOutside(event, dialog);
            });
            dialog.addEventListener('pointerup', (event) => {
                if (pressedOutside && isOutside(event, dialog)) {
                    dialog.close();
                }
            });
        });
    }

    function updateElapsedTimes() {
        let changed = false;
        const now = Date.now();
        timers = timers.map((timer) => {
            if (timer.isRunning && !timer.isPaused && timer.startTime !== null) {
                const elapsed = Math.max(0, Math.floor((now - timer.startTime) / 1000));
                if (elapsed !== timer.elapsedTime) {
                    changed = true;
                    return { ...timer, elapsedTime: elapsed };
                }
            }
            return timer;
        });
        return changed;
    }

    function commitState({ skipWakeLock = false } = {}) {
        saveTimers(timers);
        renderTimers();
        if (!skipWakeLock) {
            void syncWakeLock(timers);
        }
    }

    function toggleTimer(id) {
        const now = Date.now();
        timers = timers.map((timer) => {
            if (timer.id !== id) {
                return timer;
            }
            if (!timer.isRunning) {
                const startTime = now - timer.elapsedTime * 1000;
                return { ...timer, isRunning: true, isPaused: false, startTime };
            }
            if (timer.isPaused) {
                const startTime = now - timer.elapsedTime * 1000;
                return { ...timer, isPaused: false, startTime };
            }
            const elapsed = timer.startTime !== null
                ? Math.max(0, Math.floor((now - timer.startTime) / 1000))
                : timer.elapsedTime;
            return { ...timer, isPaused: true, elapsedTime: elapsed, startTime: null };
        });
        commitState();
    }

    function resetTimer(id) {
        timers = timers.map((timer) =>
            timer.id === id
                ? { ...timer, elapsedTime: 0, isRunning: false, isPaused: false, startTime: null }
                : timer
        );
        commitState();
    }

    function resetAllTimers() {
        timers = timers.map((timer) => ({
            ...timer,
            elapsedTime: 0,
            isRunning: false,
            isPaused: false,
            startTime: null,
        }));
        commitState();
    }

    function addTimer(name) {
        const trimmed = name.trim();
        if (!trimmed) {
            return;
        }
        timers = [...timers, createTimer(trimmed)];
        commitState();
    }

    function deleteTimer(id) {
        timers = timers.filter((timer) => timer.id !== id);
        commitState();
    }

    function reorderTimers(draggedId, dropId) {
        if (!draggedId || !dropId || draggedId === dropId) {
            return;
        }
        const draggedIndex = timers.findIndex((t) => t.id === draggedId);
        const dropIndex = timers.findIndex((t) => t.id === dropId);
        if (draggedIndex === -1 || dropIndex === -1 || draggedIndex === dropIndex) {
            return;
        }

        const next = [...timers];
        const [moved] = next.splice(draggedIndex, 1);
        next.splice(dropIndex, 0, moved);
        timers = next;
        commitState({ skipWakeLock: true });
    }

    function buildComplexityRow(timer, type) {
        const row = document.createElement('div');
        row.className = 'complexity-row';

        const multiplier = get99417Multiplier(timer, type);
        if (multiplier > 0) {
            const ext = document.createElement('span');
            ext.className = 'extended-code';
            ext.textContent = multiplier > 1 ? `99417 x ${multiplier}` : '99417';
            row.appendChild(ext);
        }

        const label = document.createElement('span');
        label.className = 'complexity-label';
        label.textContent = type;
        row.appendChild(label);

        const value = document.createElement('span');
        value.className = 'complexity-value';
        value.textContent = String(getComplexityCode(timer, type));
        row.appendChild(value);

        return row;
    }

    function createTimerCard(timer) {
        const isActive = timer.isRunning && !timer.isPaused;

        const card = document.createElement('article');
        card.className = 'timer-card';
        if (timer.elapsedTime > 0) {
            card.classList.add('has-elapsed-time');
        }
        card.dataset.timerId = timer.id;
        card.draggable = isReorderMode;

        // Drag-and-drop handlers (active only in Reorder mode)
        card.addEventListener('dragstart', (event) => {
            if (!isReorderMode) return;
            card.classList.add('dragging');
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', timer.id);
        });

        card.addEventListener('dragend', () => {
            if (!isReorderMode) return;
            card.classList.remove('dragging');
            timerListEl.querySelectorAll('.timer-card.drag-over').forEach((el) => {
                el.classList.remove('drag-over');
            });
        });

        card.addEventListener('dragover', (event) => {
            if (!isReorderMode) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            card.classList.add('drag-over');
        });

        card.addEventListener('dragleave', () => {
            if (!isReorderMode) return;
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', (event) => {
            if (!isReorderMode) return;
            event.preventDefault();
            card.classList.remove('drag-over');
            const draggedId = event.dataTransfer.getData('text/plain');
            reorderTimers(draggedId, timer.id);
        });

        // Clicking anywhere on the card (outside buttons) toggles the timer
        card.addEventListener('click', (event) => {
            if (isReorderMode || event.target.closest('button')) {
                return;
            }
            toggleTimer(timer.id);
        });

        // Card Header
        const header = document.createElement('div');
        header.className = 'timer-header';

        const titleGroup = document.createElement('div');
        titleGroup.className = 'timer-title-group';

        const grip = document.createElement('span');
        grip.className = 'drag-grip';
        grip.appendChild(createSvgIcon('ct-icon-grip', 18));
        titleGroup.appendChild(grip);

        const nameEl = document.createElement('span');
        nameEl.className = 'timer-name';
        nameEl.textContent = timer.name;
        titleGroup.appendChild(nameEl);

        const controls = document.createElement('div');
        controls.className = 'header-controls';

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.className = 'action-button reset-button';
        resetBtn.setAttribute('aria-label', `Reset ${timer.name} timer`);
        resetBtn.title = 'Reset timer';
        resetBtn.appendChild(createSvgIcon('ct-icon-reset', 17));
        resetBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            resetTimer(timer.id);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.type = 'button';
        deleteBtn.className = 'action-button delete-button';
        deleteBtn.setAttribute('aria-label', `Delete ${timer.name} timer`);
        deleteBtn.title = 'Delete timer';
        deleteBtn.appendChild(createSvgIcon('ct-icon-trash', 17));
        deleteBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            pendingDeleteId = timer.id;
            deleteTimerDialog.showModal();
        });

        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${
            !timer.isRunning ? 'status-ready' : timer.isPaused ? 'status-paused' : 'status-running'
        }`;
        statusBadge.textContent = !timer.isRunning ? 'Ready' : timer.isPaused ? 'Paused' : 'Running';

        controls.append(resetBtn, deleteBtn, statusBadge);
        header.append(titleGroup, controls);

        // Card Body (time, CPT complexity, play/pause)
        const display = document.createElement('div');
        display.className = 'timer-display';

        const timeEl = document.createElement('span');
        timeEl.className = isActive ? 'time running' : 'time';
        timeEl.textContent = formatTime(timer.elapsedTime);

        const rightGroup = document.createElement('div');
        rightGroup.className = 'timer-right';

        const complexity = document.createElement('div');
        complexity.className = 'complexity';
        complexity.append(
            buildComplexityRow(timer, 'EST'),
            buildComplexityRow(timer, 'NEW')
        );

        const playBtn = document.createElement('button');
        playBtn.type = 'button';
        playBtn.className = `play-button ${isActive ? 'running' : 'stopped'}`;
        playBtn.setAttribute('aria-label', `${isActive ? 'Pause' : 'Start'} ${timer.name} timer`);
        playBtn.title = isActive ? 'Pause timer' : 'Start timer';
        playBtn.appendChild(createSvgIcon(isActive ? 'ct-icon-pause' : 'ct-icon-play', 20));
        playBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (!isReorderMode) {
                toggleTimer(timer.id);
            }
        });

        rightGroup.append(complexity, playBtn);
        display.append(timeEl, rightGroup);

        card.append(header, display);
        return card;
    }

    function renderTimers() {
        const fragment = document.createDocumentFragment();
        timers.forEach((timer) => {
            fragment.appendChild(createTimerCard(timer));
        });
        timerListEl.replaceChildren(fragment);
    }

    function updateCardsInPlace() {
        const timerById = new Map(timers.map((t) => [t.id, t]));
        timerListEl.querySelectorAll('.timer-card').forEach((card) => {
            const timer = timerById.get(card.dataset.timerId);
            if (!timer) return;

            card.classList.toggle('has-elapsed-time', timer.elapsedTime > 0);

            const timeEl = card.querySelector('.time');
            if (timeEl) {
                timeEl.textContent = formatTime(timer.elapsedTime);
            }

            const complexityEl = card.querySelector('.complexity');
            if (complexityEl) {
                complexityEl.replaceChildren(
                    buildComplexityRow(timer, 'EST'),
                    buildComplexityRow(timer, 'NEW')
                );
            }
        });
    }

    // Header actions
    resetAllBtn.addEventListener('click', () => {
        resetAllDialog.showModal();
    });

    reorderBtn.addEventListener('click', () => {
        isReorderMode = !isReorderMode;
        reorderBtn.classList.toggle('active', isReorderMode);
        reorderBtn.setAttribute('aria-pressed', String(isReorderMode));
        renderTimers();
    });

    addTimerBtn.addEventListener('click', () => {
        addTimerForm.reset();
        addTimerDialog.showModal();
        timerNameInput.focus();
    });

    addTimerCancelBtn.addEventListener('click', () => {
        addTimerDialog.close('cancel');
    });

    // Dialog close handlers (always reset returnValue after reading)
    addTimerDialog.addEventListener('close', () => {
        const action = addTimerDialog.returnValue;
        addTimerDialog.returnValue = '';
        if (action === 'confirm') {
            addTimer(timerNameInput.value);
        }
        addTimerForm.reset();
    });

    resetAllDialog.addEventListener('close', () => {
        const action = resetAllDialog.returnValue;
        resetAllDialog.returnValue = '';
        if (action === 'confirm') {
            resetAllTimers();
        }
    });

    deleteTimerDialog.addEventListener('close', () => {
        const action = deleteTimerDialog.returnValue;
        deleteTimerDialog.returnValue = '';
        const targetId = pendingDeleteId;
        pendingDeleteId = null;
        if (action === 'confirm' && targetId) {
            deleteTimer(targetId);
        }
    });

    // Periodic tick and visibility sync (updates time/codes in-place to preserve focus & drag state)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            if (updateElapsedTimes()) {
                saveTimers(timers);
                updateCardsInPlace();
            }
            void syncWakeLock(timers);
        }
    });

    setInterval(() => {
        if (updateElapsedTimes()) {
            saveTimers(timers);
            updateCardsInPlace();
        }
    }, 1000);

    // Initial render
    saveTimers(timers);
    renderTimers();
})();
