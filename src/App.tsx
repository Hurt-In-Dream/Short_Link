import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import { supabase } from './lib/supabase';

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const DOMAINS = [
  's.011600.xyz',
  's.116514.xyz',
  's.277891.xyz',
  's.hurtindream.de',
  's.hurtindream.qzz.io',
  's.lovesora.de'
];

export default function App() {
  const [longUrl, setLongUrl] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(DOMAINS[0]);
  const [customCode, setCustomCode] = useState('');
  const [password, setPassword] = useState('');
  const [expireIn, setExpireIn] = useState('7天');

  const [isLoading, setIsLoading] = useState(false);
  const [shortLink, setShortLink] = useState('');

  const handleGenerate = async () => {
    if (!longUrl) return;

    // VERY BASIC client-side validation for URL
    let targetUrl = longUrl;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = 'http://' + targetUrl;
    }

    setIsLoading(true);
    const generatedCode = customCode || Math.random().toString(36).slice(2, 8);

    // Parse expiration
    let expiresAt: Date | null = null;
    if (expireIn === '7天') {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
    } else if (expireIn === '30天') {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
    }

    const { error } = await supabase
      .from('short_links')
      .insert([
        {
          domain: selectedDomain,
          short_code: generatedCode,
          target_url: targetUrl,
          password: password || null,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
        }
      ]);

    setIsLoading(false);

    if (error && error.code === '23505') {
      alert('抱歉，该短码已被使用，请更换一个！');
      return;
    } else if (error) {
      alert('生成失败: ' + error.message);
      return;
    }

    setShortLink(`https://${selectedDomain}/${generatedCode}`);
  };

  const copyToClipboard = () => {
    if (shortLink) {
      navigator.clipboard.writeText(shortLink);
      alert('已复制到剪贴板！');
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center font-sans overflow-hidden py-12">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(http://pic.wzkws116.xyz/pic?img=ua)' }}
      />
      <div className="fixed inset-0 z-0 bg-black/60 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-4xl px-4 flex flex-col items-center">

        {/* Header Texts */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
            夢中有傷の短网址生成器
          </h1>
          <p className="text-lg text-white/80 font-medium">
            专业的短链接生成工具，支持自定义短码、多域名、密码访问
          </p>
        </motion.div>

        {/* Main Glassmorphism Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
          className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2.5rem] p-6 md:p-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col"
        >



          <div className="flex flex-col gap-6">
            {/* Base Url Input Area */}
            <div className="relative group">
              <textarea
                value={longUrl}
                onChange={(e) => setLongUrl(e.target.value.replace(/\s+/g, ''))}
                placeholder="请输入要缩短的长网址，如：https://example.com"
                className="w-full h-32 md:h-40 bg-white/5 border border-white/10 rounded-2xl p-5 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10 transition-all resize-none shadow-inner"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_150px] gap-6">
              {/* Domains */}
              <div className="flex flex-col gap-2">
                <span className="text-sm text-white/70 font-medium pl-1">选择域名</span>
                <div className="flex flex-wrap gap-2 p-3 bg-white/5 border border-white/10 rounded-2xl">
                  {DOMAINS.map(domain => (
                    <button
                      key={domain}
                      onClick={() => setSelectedDomain(domain)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all border",
                        selectedDomain === domain
                          ? "bg-blue-600/20 border-blue-500 text-blue-100"
                          : "border-transparent text-white/60 hover:bg-white/10 hover:text-white"
                      )}
                    >
                      <div className={cn("w-3 h-3 rounded-full border-2", selectedDomain === domain ? "bg-blue-500 border-blue-500" : "border-white/40")} />
                      {domain}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expiration */}
              <div className="flex flex-col gap-2">
                <span className="text-sm text-white/70 font-medium pl-1">有效期</span>
                <div className="relative">
                  <select
                    value={expireIn}
                    onChange={(e) => setExpireIn(e.target.value)}
                    className="w-full appearance-none bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
                  >
                    <option className="bg-gray-800 text-white" value="7天">7天</option>
                    <option className="bg-gray-800 text-white" value="30天">30天</option>
                    <option className="bg-gray-800 text-white" value="永久">永久</option>
                  </select>
                  <Icon icon="lucide:chevron-down" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Custom Shortcode */}
              <div className="flex flex-col gap-2">
                <span className="text-sm text-white/70 font-medium pl-1">自定义短码</span>
                <div className="relative group">
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                    placeholder="可设置4-10个字符"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10 transition-all font-mono"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                    <Icon icon="lucide:lock" className="w-5 h-5" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-2">
                <span className="text-sm text-white/70 font-medium pl-1">访问密码</span>
                <div className="relative group">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="可设置4-10位密码"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-4 pr-12 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-white/10 transition-all"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                    <Icon icon="lucide:lock" className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>



            <button
              onClick={handleGenerate}
              disabled={!longUrl || isLoading}
              className={cn(
                "w-full py-4 mt-2 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all",
                (!longUrl || isLoading)
                  ? "bg-white/5 text-white/40 cursor-not-allowed border border-white/10"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] active:scale-[0.98]"
              )}
            >
              {isLoading ? (
                <Icon icon="lucide:loader-2" className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Icon icon="lucide:link" className="w-5 h-5" />
                  生 成 短 链 接
                </>
              )}
            </button>

            {/* Generated Result Alert */}
            <AnimatePresence>
              {shortLink && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4"
                >
                  <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-col">
                      <span className="text-green-200 text-sm font-medium mb-1">生成成功！</span>
                      <a href={shortLink} target="_blank" rel="noopener noreferrer" className="text-white font-mono text-lg truncate max-w-sm hover:underline">
                        {shortLink}
                      </a>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap"
                    >
                      复 制 链 接
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>

        <p className="mt-8 text-white/40 text-sm">
          © {new Date().getFullYear()} 夢中有傷の短网址生成器. All rights reserved.
        </p>

      </div>
    </div>
  );
}
