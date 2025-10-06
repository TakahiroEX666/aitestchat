export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // ✅ Route: POST /api/chat
    if (url.pathname === "/api/chat" && request.method === "POST") {
      const { messages } = await request.json();

      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          // เรียกใช้โมเดล Llama 3 (เปลี่ยนได้)
          const response = await env.AI.runStreaming(
            "@cf/meta/llama-3-8b-instruct",
            { messages }
          );

          // อ่านข้อมูลจากโมเดลทีละ chunk
          for await (const chunk of response) {
            const json = JSON.stringify(chunk);
            controller.enqueue(encoder.encode(json + "\n"));
          }

          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // ✅ สำหรับ route อื่น ๆ (หน้าเว็บ)
    return new Response("Cloudflare AI API is running", {
      headers: { "content-type": "text/plain" },
    });
  },
};
