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
        throw {
            response: {
                status: 0,
                data: { errorMessage: error.message || 'Network error' }
            }
        };
    }

    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }

    if (!res.ok) {
        throw {
            response: {
                status: res.status,
                data: data || { errorMessage: res.statusText || 'Request failed' }
            }
        };
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