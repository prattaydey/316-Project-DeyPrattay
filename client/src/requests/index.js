const DEFAULT_BASE = 'http://localhost:4000';

async function request(path, {
    method = 'GET',
    body,
    headers = {},
    base = DEFAULT_BASE,
    signal
    } = {}) {
    const hasBody = body !== undefined;
    
    let res;
    try {
        res = await fetch(`${base}${path}`, {
            method,
            credentials: 'include',
            headers: {
            ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
            ...headers
            },
            body: hasBody ? JSON.stringify(body) : undefined,
            signal
        });
    } catch (error) {
        // Network error
        const err = new Error(error.message || 'Network error');
        err.response = { status: 0, ok: false, data: { errorMessage: err.message } };
        throw err;
    }

    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
        const err = new Error((data && data.message) || res.statusText || 'Request failed');
        err.response = {
            status: res.status,
            ok: false,
            data, // whatever the server sent
        };
        throw err;
    }
    return {
        data,
        status: res.status,
        ok: res.ok,
        headers: Object.fromEntries(res.headers.entries())
    };
}

export const http = {
    get:   (p, opts={})           => request(p, { ...opts, method: 'GET' }),
    post:  (p, body, opts={})     => request(p, { ...opts, method: 'POST', body }),
    put:   (p, body, opts={})     => request(p, { ...opts, method: 'PUT',  body }),
    patch: (p, body, opts={})     => request(p, { ...opts, method: 'PATCH',body }),
    delete:(p, opts={})           => request(p, { ...opts, method: 'DELETE' }),
};