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
            const { results } = await env.DB.prepare("SELECT * FROM holidays ORDER BY holiday_date DESC").all();
            return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json" } });
        }

        if (method === "POST") {
            const { holiday_date, description } = await request.json();
            if (!holiday_date) return new Response(JSON.stringify({ error: "Tanggal wajib diisi" }), { status: 400 });

            await env.DB.prepare("INSERT INTO holidays (holiday_date, description) VALUES (?, ?)")
                .bind(holiday_date, description || "")
                .run();
            return new Response(JSON.stringify({ success: true }), { status: 201 });
        }

        if (method === "PUT") {
            const { id, holiday_date, description } = await request.json();
            if (!id || !holiday_date) return new Response(JSON.stringify({ error: "ID dan Tanggal wajib diisi" }), { status: 400 });
            await env.DB.prepare("UPDATE holidays SET holiday_date = ?, description = ? WHERE id = ?")
                .bind(holiday_date, description, id)
                .run();
            return new Response(JSON.stringify({ success: true }));
        }

        if (method === "DELETE") {
            const id = url.searchParams.get("id");
            if (!id) return new Response(JSON.stringify({ error: "ID wajib diisi" }), { status: 400 });
            await env.DB.prepare("DELETE FROM holidays WHERE id = ?").bind(id).run();
            return new Response(JSON.stringify({ success: true }));
        }

        return new Response("Method not allowed", { status: 405 });
    } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
}
