export async function onRequest(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const method = request.method;

    const authHeader = request.headers.get("Authorization");
    if (authHeader !== "Bearer bismillah-token-123") {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    try {
        if (method === "GET") {
            const date = url.searchParams.get("date");
            let query = "SELECT a.*, u.name as user_name FROM attendance a JOIN users u ON a.user_id = u.id";
            let params = [];
            if (date) {
                query += " WHERE a.date = ?";
                params.push(date);
            }
            query += " ORDER BY a.date DESC, a.created_at DESC LIMIT 100";

            const { results } = await env.DB.prepare(query).bind(...params).all();
            return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
        }

        if (method === "POST") {
            const { user_id, status, date } = await request.json();
            if (!user_id || !status || !date) return new Response(JSON.stringify({ error: "Data tidak lengkap" }), { status: 400 });

            // Check duplicate
            const existing = await env.DB.prepare("SELECT id FROM attendance WHERE user_id = ? AND date = ?")
                .bind(user_id, date).first();
            if (existing) return new Response(JSON.stringify({ error: "User sudah memiliki data absensi pada tanggal tersebut" }), { status: 409 });

            await env.DB.prepare("INSERT INTO attendance (user_id, status, date) VALUES (?, ?, ?)")
                .bind(user_id, status, date)
                .run();
            return new Response(JSON.stringify({ success: true }), { status: 201 });
        }

        if (method === "PUT") {
            const { id, status, date } = await request.json();
            if (!id || !status || !date) return new Response(JSON.stringify({ error: "Data tidak lengkap" }), { status: 400 });
            await env.DB.prepare("UPDATE attendance SET status = ?, date = ? WHERE id = ?")
                .bind(status, date, id)
                .run();
            return new Response(JSON.stringify({ success: true }));
        }

        if (method === "DELETE") {
            const id = url.searchParams.get("id");
            if (!id) return new Response(JSON.stringify({ error: "ID wajib diisi" }), { status: 400 });
            await env.DB.prepare("DELETE FROM attendance WHERE id = ?").bind(id).run();
            return new Response(JSON.stringify({ success: true }));
        }

        return new Response("Method not allowed", { status: 405 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
