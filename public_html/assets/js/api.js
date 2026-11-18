// SafeCommute API Client & Toast Notification Setup
const notyf = new Notyf({
    duration: 3500,
    position: { x: 'center', y: 'top' },
    dismissible: true,
    types: [
        {
            type: 'info',
            background: '#3B82F6',
            icon: false
        }
    ]
});

window.SafeToast = {
    success: (msg) => notyf.success(msg),
    error: (msg) => notyf.error(msg),
    info: (msg) => notyf.open({ type: 'info', message: msg })
};

window.SafeAPI = {
    csrfToken: document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',

    async refreshCsrf() {
        try {
            const res = await fetch('/api/csrf');
            const data = await res.json();
            if (data.data?.csrf_token) {
                this.csrfToken = data.data.csrf_token;
            }
        } catch (e) {
            console.error('Failed to refresh CSRF', e);
        }
    },

    async request(url, options = {}) {
        options.headers = options.headers || {};
        
        // Add CSRF header for non-GET requests
        if (options.method && options.method.toUpperCase() !== 'GET') {
            if (!this.csrfToken) {
                await this.refreshCsrf();
            }
            options.headers['X-CSRF-Token'] = this.csrfToken;
        }

        try {
            const res = await fetch(url, options);
            if (res.status === 304) {
                return { notModified: true };
            }
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Terjadi kesalahan sistem.');
            }
            return data;
        } catch (err) {
            throw err;
        }
    },

    get(url) {
        return this.request(url, { method: 'GET' });
    },

    post(url, body) {
        const isFormData = body instanceof FormData;
        const options = {
            method: 'POST',
            body: isFormData ? body : JSON.stringify(body)
        };
        if (!isFormData) {
            options.headers = { 'Content-Type': 'application/json' };
        }
        return this.request(url, options);
    },

    patch(url, body) {
        return this.request(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
    },

    delete(url) {
        return this.request(url, { method: 'DELETE' });
    }
};
