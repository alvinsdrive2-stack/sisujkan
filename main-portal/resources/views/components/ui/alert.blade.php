@props([
    'show' => false,
    'message' => '',
    'type' => 'info',
    'autoClose' => true
])

<div x-data="{
    show: @js($show),
    message: @js($message),
    type: @js($type),
    autoClose: @js($autoClose),

    init() {
        if (this.autoClose && this.show) {
            setTimeout(() => {
                this.show = false;
            }, 5000);
        }
    }
}"
     x-show="show"
     x-transition:enter="transition ease-out duration-300"
     x-transition:enter-start="opacity-0 transform translate-y-2"
     x-transition:enter-end="opacity-100 transform translate-y-0"
     x-transition:leave="transition ease-in duration-200"
     x-transition:leave-start="opacity-100"
     x-transition:leave-end="opacity-0"
     class="fixed top-4 right-4 z-[9999] flex items-center p-4 rounded-lg shadow-lg max-w-sm w-full"
     :class="type === 'success' ? 'bg-green-500 text-white' :
                type === 'error' ? 'bg-red-500 text-white' :
                type === 'warning' ? 'bg-amber-500 text-white' :
                'bg-blue-500 text-white'">
    <div class="flex-shrink-0">
        <i class="fas text-xl"
           :class="type === 'success' ? 'fa-check-circle' :
                      type === 'error' ? 'fa-exclamation-circle' :
                      type === 'warning' ? 'fa-exclamation-triangle' :
                      'fa-info-circle'"></i>
    </div>
    <div class="ml-3 flex-1">
        <p class="text-sm font-medium" x-text="message"></p>
    </div>
    <div class="ml-4 flex-shrink-0">
        <button @click="show = false" class="inline-flex text-white hover:opacity-75 focus:outline-none">
            <i class="fas fa-times"></i>
        </button>
    </div>
</div>

<!-- Make alert globally available -->
<script>
    window.showAlert = function(message, type = 'info', duration = 5000) {
        // Create a unique ID for this alert
        const alertId = 'alert-' + Date.now();

        // Create the alert container if it doesn't exist
        let alertContainer = document.getElementById('alert-container');
        if (!alertContainer) {
            alertContainer = document.createElement('div');
            alertContainer.id = 'alert-container';
            alertContainer.className = 'fixed top-4 right-4 z-[9999] space-y-2';
            document.body.appendChild(alertContainer);
        }

        // Create alert element
        const alertEl = document.createElement('div');
        alertEl.id = alertId;
        alertEl.className = `flex items-center p-4 rounded-lg shadow-lg max-w-sm w-full transition-all duration-300 transform translate-x-full ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            type === 'warning' ? 'bg-amber-500 text-white' :
            'bg-blue-500 text-white'
        }`;

        alertEl.innerHTML = `
            <div class="flex-shrink-0">
                <i class="fas text-xl ${
                    type === 'success' ? 'fa-check-circle' :
                    type === 'error' ? 'fa-exclamation-circle' :
                    type === 'warning' ? 'fa-exclamation-triangle' :
                    'fa-info-circle'
                }"></i>
            </div>
            <div class="ml-3 flex-1">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <div class="ml-4 flex-shrink-0">
                <button onclick="closeAlert('${alertId}')" class="inline-flex text-white hover:opacity-75 focus:outline-none">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Add to container
        alertContainer.appendChild(alertEl);

        // Animate in
        setTimeout(() => {
            alertEl.classList.remove('translate-x-full');
            alertEl.classList.add('translate-x-0');
        }, 10);

        // Auto close
        if (duration > 0) {
            setTimeout(() => {
                closeAlert(alertId);
            }, duration);
        }

        return alertId;
    };

    window.closeAlert = function(alertId) {
        const alertEl = document.getElementById(alertId);
        if (alertEl) {
            alertEl.classList.remove('translate-x-0');
            alertEl.classList.add('translate-x-full');
            setTimeout(() => {
                alertEl.remove();
            }, 300);
        }
    };
</script>