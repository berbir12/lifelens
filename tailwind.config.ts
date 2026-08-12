import type { Config } from "tailwindcss";
export default { darkMode: "class", content: ["./app/**/*.{ts,tsx}","./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink:"#243028", cream:"#F7F4ED", sage:"#6F8068", moss:"#314A3B", coral:"#DC846D", sand:"#EAE3D6" }, boxShadow:{soft:"0 12px 40px rgba(49,74,59,.08)"}, borderRadius:{"4xl":"2rem"} } }, plugins: [] } satisfies Config;
