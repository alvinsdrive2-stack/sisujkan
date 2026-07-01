@props([
    'show' => false,
    'title' => 'Confirm Action',
    'message' => 'Are you sure you want to proceed?',
    'type' => 'danger',
    'confirmText' => 'Confirm',
    'cancelText' => 'Cancel',
    'onConfirm' => null,
    'onCancel' => null
])

<div x-data="{
    show: @js($show),
    title: @js($title),
    message: @js($message),
    type: @js($type),
    confirmText: @js($confirmText),
    cancelText: @js($cancelText),
    onConfirm: @js($onConfirm),
    onCancel: @js($onCancel)
}"
     x-show="show"
     x-transition:enter="transition ease-out duration-300"
     x-transition:enter-start="opacity-0"
     x-transition:enter-end="opacity-100"
     x-transition:leave="transition ease-in duration-200"
     x-transition:leave-start="opacity-100"
     x-transition:leave-end="opacity-0"
     class="fixed inset-0 overflow-y-auto z-[60]"
     style="display: none;">
    <div class="flex items-center justify-center min-h-screen px-4">
        <div class="fixed inset-0 bg-gray-900 bg-opacity-50" @click="show = false; if (onCancel) onCancel();"></div>

        <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div class="flex items-center mb-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <div class="ml-4">
                    <h3 class="text-lg font-semibold text-gray-900" x-text="title"></h3>
                </div>
            </div>

            <p class="text-gray-600 mb-6" x-text="message"></p>

            <div class="flex justify-end gap-3">
                <button @click="show = false; if (onCancel) onCancel();"
                        class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                    <span x-text="cancelText"></span>
                </button>
                <button @click="show = false; if (onConfirm) onConfirm();"
                        class="px-4 py-2 text-white rounded-lg transition-colors"
                        :class="type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'">
                    <span x-text="confirmText"></span>
                </button>
            </div>
        </div>
    </div>
</div>

<!-- Make confirm dialog globally available -->
<script>
    window.showConfirm = function(title, message, onConfirm, options = {}) {
        const config = {
            type: options.type || 'danger',
            confirmText: options.confirmText || 'Confirm',
            cancelText: options.cancelText || 'Cancel',
            onCancel: options.onCancel || null
        };

        // Create dialog container if it doesn't exist
        let dialogContainer = document.getElementById('confirm-dialog-container');
        if (!dialogContainer) {
            dialogContainer = document.createElement('div');
            dialogContainer.id = 'confirm-dialog-container';
            document.body.appendChild(dialogContainer);
        }

        // Create dialog element
        const dialogId = 'confirm-' + Date.now();
        const dialogEl = document.createElement('div');
        dialogEl.id = dialogId;
        dialogEl.className = 'fixed inset-0 overflow-y-auto z-[60] transition-all duration-300';
        dialogEl.style.opacity = '0';

        dialogEl.innerHTML = `
            <div class="flex items-center justify-center min-h-screen px-4">
                <div class="fixed inset-0 bg-gray-900 bg-opacity-50" onclick="closeConfirm('${dialogId}', false)"></div>
                <div class="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 transform transition-all duration-300 scale-95">
                    <div class="flex items-center mb-4">
                        <div class="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
                        </div>
                    </div>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex justify-end gap-3">
                        <button onclick="closeConfirm('${dialogId}', false)" class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                            ${config.cancelText}
                        </button>
                        <button onclick="closeConfirm('${dialogId}', true)" class="px-4 py-2 text-white rounded-lg transition-colors ${
                            config.type === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                        }">
                            ${config.confirmText}
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Store callbacks as functions
        dialogEl.confirmCallback = onConfirm;
        dialogEl.cancelCallback = config.onCancel;

        // Add to container
        dialogContainer.appendChild(dialogEl);

        // Animate in
        setTimeout(() => {
            dialogEl.style.opacity = '1';
            const modal = dialogEl.querySelector('.transform');
            modal.classList.remove('scale-95');
            modal.classList.add('scale-100');
        }, 10);

        // Store reference
        window.currentConfirmDialog = dialogId;

        return dialogId;
    };

    window.closeConfirm = function(dialogId, confirmed) {
        const dialogEl = document.getElementById(dialogId);
        if (!dialogEl) return;

        // Animate out
        dialogEl.style.opacity = '0';
        const modal = dialogEl.querySelector('.transform');
        modal.classList.remove('scale-100');
        modal.classList.add('scale-95');

        setTimeout(() => {
            // Execute callback
            if (confirmed && dialogEl.confirmCallback) {
                try {
                    dialogEl.confirmCallback();
                } catch (e) {
                    console.error('Error executing confirm callback:', e);
                }
            } else if (!confirmed && dialogEl.cancelCallback) {
                try {
                    dialogEl.cancelCallback();
                } catch (e) {
                    console.error('Error executing cancel callback:', e);
                }
            }

            dialogEl.remove();
            if (window.currentConfirmDialog === dialogId) {
                window.currentConfirmDialog = null;
            }
        }, 300);
    };
</script>