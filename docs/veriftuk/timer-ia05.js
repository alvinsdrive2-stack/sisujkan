/**
 * Timer untuk IA05 - Persist via localStorage
 * Auto-save + redirect saat expired
 */

class ExamTimer {
    constructor(options = {}) {
        this.storageKey = options.storageKey || 'ia05_timer';
        this.duration = options.duration || 60 * 60; // 60 menit dalam detik
        this.onExpire = options.onExpire || (() => {});
        this.onTick = options.onTick || (() => {});
        this.intervalId = null;
        this.isPaused = false;
    }

    // Mulai timer (baru atau resume)
    start() {
        const saved = this.getSavedState();
        const now = Date.now();

        if (saved && !saved.expired) {
            // Resume existing timer
            const elapsed = Math.floor((now - saved.startTime) / 1000);
            this.remaining = Math.max(0, saved.duration - elapsed);

            if (this.remaining <= 0) {
                this.handleExpire();
                return;
            }
        } else {
            // Start new timer
            this.saveState({
                startTime: now,
                duration: this.duration,
                expired: false
            });
            this.remaining = this.duration;
        }

        this.run();
    }

    // Jalankan countdown
    run() {
        this.intervalId = setInterval(() => {
            if (this.isPaused) return;

            this.remaining--;
            this.onTick(this.remaining);

            // Update storage periodically (every 5 seconds)
            if (this.remaining % 5 === 0) {
                this.saveDuration(this.remaining);
            }

            if (this.remaining <= 0) {
                this.handleExpire();
            }
        }, 1000);
    }

    // Handle expired
    handleExpire() {
        this.stop();
        this.saveState({ expired: true });
        this.onExpire();
    }

    // Stop timer
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    // Pause timer
    pause() {
        this.isPaused = true;
        this.saveDuration(this.remaining);
    }

    // Resume timer
    resume() {
        this.isPaused = false;
    }

    // Reset timer
    reset() {
        this.stop();
        localStorage.removeItem(this.storageKey);
        this.start();
    }

    // Format waktu ke MM:SS
    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // Get saved state from localStorage
    getSavedState() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    // Save state to localStorage
    saveState(state) {
        try {
            const existing = this.getSavedState() || {};
            localStorage.setItem(this.storageKey, JSON.stringify({ ...existing, ...state }));
        } catch (e) {
            console.error('Gagal save timer state:', e);
        }
    }

    // Update remaining duration
    saveDuration(remaining) {
        this.saveState({ remaining });
    }

    // Get remaining time
    getRemaining() {
        return this.remaining;
    }

    // Check if timer expired
    isExpired() {
        const saved = this.getSavedState();
        return saved?.expired || false;
    }

    // Clear timer data
    clear() {
        this.stop();
        localStorage.removeItem(this.storageKey);
    }
}

// ===== USAGE EXAMPLE =====
/*
// Setup timer untuk IA05
const timer = new ExamTimer({
    duration: 60 * 60, // 60 menit
    onTick: (remaining) => {
        // Update display setiap detik
        document.getElementById('timerDisplay').textContent = timer.formatTime(remaining);

        // Warning di 5 menit terakhir
        if (remaining <= 300) {
            document.getElementById('timerDisplay').style.color = 'red';
        }
    },
    onExpire: () => {
        // Auto-save saat waktu habis
        handleSave(); // Ganti dengan fungsi save kamu

        // Redirect ke next page
        window.location.href = '/next-page'; // Ganti URL tujuan
    }
});

// Mulai timer saat page load
timer.start();

// Pause saat user ingin istirahat (optional)
document.getElementById('pauseBtn')?.addEventListener('click', () => timer.pause());
document.getElementById('resumeBtn')?.addEventListener('click', () => timer.resume());
*/
