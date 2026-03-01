// Cloudflare Worker Script for Short Link Redirection
// 部署方式：在 Cloudflare 中新建 Worker，将此代码粘贴进去。然后在“触发器”中绑定你的所有自定义域名（如 c1n.me, 80c.me 等）。

// 请替换为你自己的 Supabase 项目配置
const SUPABASE_URL = 'YOUR_SUPABASE_PROJECT_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const domain = url.hostname;
        // 获取短码，去掉开头的斜杠
        const shortCode = url.pathname.slice(1);

        // 如果只是访问根域名，则可以跳转到你的短链接生成器前端页面
        if (!shortCode) {
            // 您可以将下方的URL替换为您的前端部署地址
            return Response.redirect('https://YOUR_FRONTEND_DOMAIN', 301);
        }

        // 通过 Supabase REST API 查询对应的目标链接 (Edge 环境下推荐使用 REST)
        // 根据 domain 和 short_code 共同查询记录
        const apiUrl = `${SUPABASE_URL}/rest/v1/short_links?domain=eq.${domain}&short_code=eq.${shortCode}&select=target_url,password,expires_at`;

        try {
            const response = await fetch(apiUrl, {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                return new Response('Database connection error', { status: 500 });
            }

            const data = await response.json();

            if (!data || data.length === 0) {
                return new Response('Short link not found', { status: 404 });
            }

            const linkData = data[0];

            // 检查是否过期
            if (linkData.expires_at && new Date(linkData.expires_at) < new Date()) {
                return new Response('This link has expired', { status: 410 });
            }

            // 如果有访问密码
            if (linkData.password) {
                // 在实际业务中，可以返回一小段 HTML 要求输入密码并通过前端脚本跳转，
                // 或者处理 POST 请求并验证密码。这里提供一段极简的 HTML 密码输入页。
                if (request.method === "POST") {
                    const formData = await request.formData();
                    const inputPassword = formData.get('password');
                    if (inputPassword === linkData.password) {
                        return Response.redirect(linkData.target_url, 302);
                    } else {
                        return new Response('密码错误，请返回重试。', { status: 401, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
                    }
                } else {
                    const html = `
           <!DOCTYPE html>
           <html>
           <head>
             <meta charset="utf-8">
             <meta name="viewport" content="width=device-width, initial-scale=1">
             <title>请输入访问密码</title>
             <style>
                body { background: #000; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 30px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.2); text-align: center; }
                input { padding: 10px; border-radius: 8px; border: none; outline: none; margin-bottom: 15px; width: 100%; box-sizing: border-box; }
                button { background: #2563eb; color: #fff; padding: 10px 20px; border: none; border-radius: 8px; cursor: pointer; width: 100%; font-weight: bold; }
             </style>
           </head>
           <body>
             <div class="card">
                <h2>受保护的链接</h2>
                <form method="POST">
                  <input type="password" name="password" placeholder="请输入访问密码" required />
                  <button type="submit">确认访问</button>
                </form>
             </div>
           </body>
           </html>
           `;
                    return new Response(html, { headers: { 'Content-Type': 'text/html;charset=UTF-8' } });
                }
            }

            // 如果没有密码且未过期，直接进行 HTTP 302 重定向到长链接
            return Response.redirect(linkData.target_url, 302);

        } catch (err) {
            return new Response('Internal Server Error: ' + err.message, { status: 500 });
        }
    },
};
