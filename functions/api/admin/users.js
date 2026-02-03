export async function onRequest(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const method = request.method;

    // Basic Auth Check (Simplistic for this demo)
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== "Bearer bismillah-token-123") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        if (method === "GET") {
            const { results } = await env.DB.prepare("SELECT * FROM users ORDER BY name ASC").all();
            return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
        }

        if (method === "POST") {
            const { name, role } = await request.json();
            if (!name) return new Response(JSON.stringify({ error: "Nama wajib diisi" }), { status: 400 });
            await env.DB.prepare("INSERT INTO users (name, role) VALUES (?, ?)")
                .bind(name, role || "Guru/Karyawan")
                .run();
            return new Response(JSON.stringify({ success: true }), { status: 201 });
        }

        if (method === "PUT") {
            const { id, name, role } = await request.json();
            if (!id || !name) return new Response(JSON.stringify({ error: "ID dan Nama wajib diisi" }), { status: 400 });
            await env.DB.prepare("UPDATE users SET name = ?, role = ? WHERE id = ?")
                .bind(name, role, id)
                .run();
            return new Response(JSON.stringify({ success: true }));
        }

        if (method === "DELETE") {
            const id = url.searchParams.get("id");
            if (!id) return new Response(JSON.stringify({ error: "ID wajib diisi" }), { status: 400 });
            await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
            return new Response(JSON.stringify({ success: true }));
        }

        return new Response("Method not allowed", { status: 405 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
