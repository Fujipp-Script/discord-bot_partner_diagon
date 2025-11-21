📦 your-bot/
├─ 📁 src/
│  ├─ 📁 app/
│  │  └─ index.ts                 # จุดเข้าโปรแกรมหลัก (single-process)
│  ├─ 📁 core/
│  │  ├─ client.ts                # ตั้งค่า Discord Client + Intents + Partials
│  │  ├─ env.ts                   # โหลด/ตรวจค่า .env ด้วย Zod
│  │  ├─ logger.ts                # Logger (pino)
│  │  ├─ error.ts                 # Error boundary + report helper
│  │  ├─ cache.ts                 # In-memory/Redis interface (optional)
│  │  └─ rateLimiter.ts           # Bottleneck (optional)
│  ├─ 📁 handlers/
│  │  ├─ interactionHandler.ts    # ศูนย์รวม handle: slash, button, modal, select, context
│  │  ├─ autocompleteHandler.ts   # แยกสำหรับ autocomplete
│  │  └─ componentRouter.ts       # Router ของ customId -> action
│  ├─ 📁 loaders/
│  │  ├─ commandLoader.ts         # โหลดคำสั่งอัตโนมัติ (glob)
│  │  ├─ eventLoader.ts           # ผูก event อัตโนมัติ
│  │  ├─ componentLoader.ts       # โหลดปุ่ม/โมดัล/เซเล็ค
│  │  └─ jobLoader.ts             # โหลด cron jobs
│  ├─ 📁 types/
│  │  ├─ Command.ts               # interface มาตรฐานของ Slash/Context
│  │  └─ Component.ts             # interface มาตรฐานของปุ่ม/โมดัล/เซเล็ค
│  ├─ 📁 events/
│  │  ├─ ready.ts
│  │  ├─ interactionCreate.ts
│  │  ├─ guildMemberAdd.ts
│  │  └─ messageCreate.ts         # เปิดใช้เมื่อจำเป็น (Message Content)
│  ├─ 📁 commands/
│  │  ├─ 🗂️ admin/
│  │  │  └─ config.ts             # ตัวอย่าง: config ต่อกิลด์
│  │  ├─ 🗂️ util/
│  │  │  └─ ping.ts               # ตัวอย่างคำสั่งพื้นฐาน
│  │  └─ (เพิ่มหมวดอื่น ๆ ตามฟีเจอร์)
│  ├─ 📁 interactions/
│  │  ├─ buttons/
│  │  │  └─ btn_refresh.ts
│  │  ├─ modals/
│  │  │  └─ modal_verify.ts
│  │  ├─ selects/
│  │  │  └─ sel_example.ts
│  │  └─ context/
│  │     └─ user_report.ts
│  ├─ 📁 jobs/
│  │  ├─ refreshEmbeds.job.ts     # ตัวอย่างงาน cron
│  │  └─ syncExternal.job.ts
│  ├─ 📁 web/                      # บริการเสริม (Fastify/Express)
│  │  ├─ server.ts                # healthcheck + webhook endpoint
│  │  └─ routes/
│  │     ├─ health.ts
│  │     └─ webhook.ts
│  ├─ 📁 config/
│  │  ├─ constants.ts
│  │  ├─ permissions.ts
│  │  └─ guilds/
│  │     └─ 123456789012345678.json  # ตัวอย่าง config ต่อกิลด์
│  ├─ 📁 lib/                      # อินทิเกรตภายนอก (Roblox, SlipOK, PromptPay, OCR)
│  │  ├─ roblox.ts
│  │  ├─ slipok.ts
│  │  ├─ promptpay.ts
│  │  └─ ocr.ts
│  ├─ 📁 utils/
│  │  ├─ embeds.ts
│  │  ├─ time.ts
│  │  └─ format.ts
│  └─ shard.ts                    # (ทางเลือก) worker file สำหรับ ShardingManager
│
├─ 📁 scripts/
│  └─ deploy-commands.ts          # ลงทะเบียน Slash (guild/global)
│
├─ 📁 data/                        # JSON storage (ถ้าไม่ใช้ DB)
│  ├─ credits.json
│  └─ config.json
│
├─ 📁 prisma/                      # (ทางเลือก) Prisma + MySQL
│  └─ schema.prisma
│
├─ .env.example
├─ package.json
├─ tsconfig.json
├─ biome.json or .eslintrc.cjs + .prettierrc
├─ Dockerfile
├─ docker-compose.yml             # (ทางเลือก) dev: db/redis
├─ pm2.config.cjs                 # (ทางเลือก) รัน prod ด้วย PM2
└─ README.md