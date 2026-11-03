export type ScriptLang = "zh" | "en";

export type RemixScene = {
  id: string;
  start: number;
  end: number;
  title: string;
  zh: string;
  en: string;
};

export type ScriptTemplate = {
  id: string;
  name: string;
  scenes: RemixScene[];
};

const ZH_OF: Record<string, string> = {
  "Boiling water poured instantly on ice container (Shock Factor)": "开水直接浇在冰杯上，外壳却一点都不烫。",
  "Internal temp gauge stays at 0°C under heat torch": "喷枪对着外壁烘，内壁温度计还停在冰水刻度。",
  "Flash sale prompt with buy-1-get-1 voucher overlay": "屏幕弹出买一送一，告诉观众现在就领券下单。",
  "Steel brush scraping across fabric surface without tearing": "钢丝刷来回刮布面，面料一点都没被刮破。",
  "Squat proof opacity check under studio ring light": "环形灯下做深蹲，看面料透不透。",
  "Limited quantity claim with direct buy badge": "库存只剩这一批，角标直接跳购买。",
  "200x digital microscope close-up of clogged pore": "200 倍显微镜怼近堵塞的毛孔。",
  "Single stroke vacuuming gunk cleanly in 1 pass": "吸头拉一下，脏东西一次就被吸干净。",
  "50% off intro price for first 100 orders": "前 100 单半价，现在就能锁。",
  "Dewy cheek under a ring light, pores visible, then one drop of serum": "环形灯下脸颊起皮、毛孔清楚，接着滴一滴精华。",
  "Macro spread, glass-skin reflection, no white cast": "微距推开，皮肤像玻璃一样反光，没有泛白。",
  "Bundle price with a 24h cart reminder": "套装价配上 24 小时购物车提醒。",
  "Same corner, three jackets, zero cutaways": "同一个街角连换三件外套，中间不剪辑。",
  "Wind test on the lapel plus a pocket-stuff close-up": "风吹领口，再特写塞满的口袋。",
  "Colorway countdown and a shop-the-look sticker": "配色倒计时，贴上同款购买贴纸。",
  "Burnt grease on a steel pan, one spray, no scrubbing yet": "钢锅上全是焦黑油污，喷一下，先别擦。",
  "Paper towel lifts the stain in a single wipe": "一张厨房纸，一擦就揭掉油污。",
  "Two-pack price versus the grocery brand": "两瓶装价格，直接对比超市货。",
  "Earbud tossed onto concrete, case still closed": "耳机砸到水泥地，充电盒还盖着。",
  "Playback resumes, mic demo in street noise": "捡起来照样出声，马路噪音里试麦克风。",
  "Launch code under the waveform": "声纹下面打上首发优惠码。",
  "Slow snap of the bar, crumbs frozen in frame": "能量棒慢慢掰开，碎屑停在画面里。",
  "Macro of the filling, then a gym-bag cut": "夹心特写，再切到健身包。",
  "Subscribe-and-save price chip": "订阅价的小标签弹出来。",
  "Harsh noon light, then the curtain drops in one motion": "正午硬光很刺，窗帘一把放下来。",
  "Fabric hand-feel and a blackout side-by-side": "摸面料，再和遮光款并排比。",
  "Room-size guide with a measured-set offer": "按房间尺寸推荐，成套更划算。",
  "Shoe folded in half, sole springs back": "鞋对折，鞋底自己弹回来。",
  "Court slide plus a slow-mo outsole close-up": "场上滑步，再慢镜看大底。",
  "Size-run low stock and a free-return line": "断码提示，加上免费退换。",
  "Cup-rim test right after the first coat": "刚涂完就去蹭杯口。",
  "Tissue press, then a smile under daylight": "纸巾按压，再到日光下微笑。",
  "Shade name and a duo price": "报色号，给出两支装价格。",
  "Match strike, flame fills the frame": "火柴一划，火焰占满画面。",
  "Time-lapse of an even wax pool, no tunneling": "延时看蜡油摊得均匀，不掏洞。",
  "Three-wick set with a seasonal scent name": "三芯套装，带上这季的香名。",
  "本地参考片已导入，补一句痛点钩子": "Local clip is in. Open with the pain point.",
  "把商品卖点写进演示段": "Put the product benefits in the demo.",
  "限时折扣与下单指令": "Add the limited offer and the order line.",
};

function scene(id: string, start: number, end: number, title: string, zh: string, en: string): RemixScene {
  return { id, start, end, title, zh, en };
}

export const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: "destroy",
    name: "暴力破坏测评流",
    scenes: [
      scene("destroy-1", 0, 2, "极速吸睛", "开水或者硬物直接上，先给一个不敢眨眼的破坏动作。", "Hit it with boiling water or a hard tool before anyone can scroll."),
      scene("destroy-2", 2, 5, "材质特写", "贴着表面拍，让人看清它为什么没破、没烫、没变形。", "Stay on the surface so people can see why it did not break, burn, or bend."),
      scene("destroy-3", 5, 9, "效果实测", "再补一个极限测试，用数字或对比把结果拍明白。", "Add one extreme test and make the result obvious with a number or a side-by-side."),
      scene("destroy-4", 9, 12, "引导下单", "报优惠和库存，让观众现在就点链接。", "Say the offer and the stock, then tell them to tap the link now."),
    ],
  },
  {
    id: "asmr",
    name: "ASMR沉浸开箱",
    scenes: [
      scene("asmr-1", 0, 2, "撕膜入耳", "只留指甲挑开封条的沙沙声，先把耳朵抓住。", "Just the sound of a nail lifting the seal. Catch the ear first."),
      scene("asmr-2", 2, 6, "开箱特写", "慢慢揭开，每一层包装都拍清楚，不急着说话。", "Peel it slowly and show every layer before you talk."),
      scene("asmr-3", 6, 10, "上手触感", "手指按过材质，让观众好像自己摸到了。", "Run a finger across the material so it feels touchable."),
      scene("asmr-4", 10, 14, "轻声引导", "放轻声音报价格，邀请他们收藏并下单。", "Drop the price quietly, then ask them to save it and order."),
    ],
  },
  {
    id: "contrast",
    name: "痛点视觉反差",
    scenes: [
      scene("contrast-1", 0, 2, "翻车现场", "先拍没这个产品时的糟心画面，让人立刻对号入座。", "Open on the mess people already have, so they recognize themselves."),
      scene("contrast-2", 2, 6, "换上本品", "同一机位换上商品，动作要简单到一眼看懂。", "Same angle, bring the product in. One simple move is enough."),
      scene("contrast-3", 6, 10, "前后对比", "左右或前后对照，把变化摆在同一帧里。", "Put before and after in the same frame."),
      scene("contrast-4", 10, 13, "限时解决", "告诉他们这个麻烦现在就能解决，给出下单理由。", "Tell them the problem can be solved today, then give the reason to order."),
    ],
  },
  {
    id: "rush",
    name: "狂欢限时逼单",
    scenes: [
      scene("rush-1", 0, 2, "价格锚点", "先甩原价，再砸出现价，让差价自己说话。", "Flash the old price, then hit them with the current one."),
      scene("rush-2", 2, 5, "三秒卖点", "只用三个能看懂的好处，一句一个。", "Three benefits, one beat each. Nothing extra."),
      scene("rush-3", 5, 8, "库存倒计时", "库存数字往下跳，制造现在就要决定的感觉。", "Tick the stock down so the decision feels immediate."),
      scene("rush-4", 8, 12, "立即下单", "手指指向链接，把优惠截止时间说死。", "Point at the link and lock the deadline out loud."),
    ],
  },
];

export function defaultScenes(): RemixScene[] {
  return [];
}

export function aiGeneratedScenes(): RemixScene[] {
  return [
    scene("ai-1", 0, 2, "视觉吸睛", "展现商品惊艳上身/开箱瞬间。", "Open on the product landing or the unboxing."),
    scene("ai-2", 2, 6, "材质与细节", "微距特写，真实面料/材质物理展示。", "Macro on the real fabric and how the material moves."),
    scene("ai-3", 6, 10, "痛点实测", "模拟日常使用场景，凸显核心卖点。", "Show a daily-use test that makes the main benefit obvious."),
    scene("ai-4", 10, 14, "引导下单", "限时折扣促销，激发点击小黄车。", "Limited-time offer, then send them to the yellow cart."),
  ];
}

const BEAT_TITLES = ["开场钩子", "演示卖点", "引导下单"];

function bodyOf(raw: string) {
  return raw.replace(/^\s*\d+\s*-\s*\d+s\s*:\s*/, "").trim();
}

function pairOf(raw: string) {
  const body = bodyOf(raw);
  const [core, ...rest] = body.split("\n");
  const extra = rest.join("\n").trim();
  const known = ZH_OF[core.trim()];
  if (known && /[\u4e00-\u9fff]/.test(known) && !/[\u4e00-\u9fff]/.test(core)) {
    return {
      zh: [known, extra].filter(Boolean).join("\n"),
      en: [core.trim(), extra].filter(Boolean).join("\n"),
    };
  }
  if (/[\u4e00-\u9fff]/.test(core)) {
    const en = ZH_OF[core.trim()];
    return { zh: body, en: en && !/[\u4e00-\u9fff]/.test(en) ? [en, extra].filter(Boolean).join("\n") : body };
  }
  return { zh: known ?? `按这个节奏把卖点讲清楚：${core.trim()}`, en: body };
}

export function scenesFromBreakdown(script: { hook: string; demo: string; cta: string }): RemixScene[] {
  const parts = [script.hook, script.demo, script.cta].map((item) => item.trim()).filter(Boolean);
  if (!parts.length) return [];
  return parts.map((raw, index) => {
    const time = raw.match(/(\d+)\s*-\s*(\d+)s/);
    const start = time ? Number(time[1]) : [0, 3, 8][index] ?? index * 3;
    const end = time ? Number(time[2]) : [3, 8, 15][index] ?? start + 3;
    const text = pairOf(raw);
    return scene(`ref-${index}-${start}`, start, end, BEAT_TITLES[index] ?? `分镜 ${index + 1}`, text.zh, text.en);
  });
}

export function scenesToBreakdown(scenes: RemixScene[], lang: ScriptLang) {
  const line = (item: RemixScene) => `${item.start}-${item.end}s ${item.title}: ${item[lang].trim()}`;
  if (!scenes.length) return { hook: "", demo: "", cta: "" };
  if (scenes.length === 1) return { hook: line(scenes[0]), demo: "", cta: "" };
  return {
    hook: line(scenes[0]),
    demo: scenes.slice(1, -1).map(line).join("\n"),
    cta: line(scenes[scenes.length - 1]),
  };
}

export function scenesToFull(scenes: RemixScene[], lang: ScriptLang) {
  return scenes.map((item) => `【${item.start}-${item.end}s ${item.title}】\n${item[lang].trim()}`).join("\n\n");
}

export function fullToScenes(text: string, previous: RemixScene[], lang: ScriptLang): RemixScene[] {
  const chunks = text.split(/\n{2,}/).map((item) => item.trim()).filter(Boolean);
  const parsed = chunks.map((chunk, index) => {
    const matched = chunk.match(/^【(\d+)\s*-\s*(\d+)s\s+([^】]+)】\s*([\s\S]*)$/);
    if (!matched) return null;
    const prior = previous[index];
    const value = matched[4].trim();
    return scene(
      prior?.id ?? `full-${index}-${matched[1]}`,
      Number(matched[1]),
      Number(matched[2]),
      matched[3].trim() || prior?.title || `分镜 ${index + 1}`,
      lang === "zh" ? value : (prior?.zh ?? ""),
      lang === "en" ? value : (prior?.en ?? ""),
    );
  });
  if (parsed.length && parsed.every(Boolean)) return parsed as RemixScene[];
  const first = previous[0] ?? scene("full-0", 0, 3, "分镜 1", "", "");
  return [{ ...first, [lang]: text.trim() }];
}

export function countScript(text: string, lang: ScriptLang) {
  if (lang === "zh") return { count: text.replace(/\s/g, "").length, unit: "字" };
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { count: words, unit: "words" };
}

export function polishLine(text: string, lang: ScriptLang) {
  const value = text.trim();
  if (!value) return text;
  if (lang === "zh") {
    if (value.includes("现在下单")) return value;
    return `${value.replace(/。?$/, "。")}说得再口语一点，最后补一句：库存不多，现在下单。`;
  }
  if (/order now/i.test(value)) return value;
  return `${value.replace(/\.?$/, ".")} Say it like a creator, then add: stock is low, order now.`;
}

export function blankScenes(): RemixScene[] {
  return [scene(`custom-${Date.now()}`, 0, 3, "分镜 1", "", "")];
}

export function nextScene(previous: RemixScene): RemixScene {
  const start = previous.end;
  const end = start + 3;
  return scene(`scene-${Date.now()}`, start, end, "新分镜", "", "");
}
