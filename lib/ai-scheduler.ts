import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";

const client = new Anthropic();

interface ScheduleInput {
  year: number;
  month: number;
  clinicDays: {
    date: string;
    sessions: {
      id: string;
      sessionType: string;
      startTime: string;
      endTime: string;
      clinicName?: string;
      doctorIds: string[];
      counterNeeded: number;
      mobileNeeded: number;
    }[];
  }[];
  assistants: {
    id: string;
    name: string;
    skills: string[];
    maxSessionsPerMonth: number | null;
  }[];
  preferenceDays: {
    assistantId: string;
    date: string;
    sessionType: string;
  }[];
  specialRules: {
    title: string;
    description: string;
    ruleType: string;
    config: string;
    isMandatory: boolean;
  }[];
  sessionQuotas: {
    assistantId: string;
    sessions: number;
  }[];
  doctors: {
    id: string;
    name: string;
    specialty: string | null;
  }[];
}

interface AssignmentResult {
  clinicSessionId: string;
  assistantId: string;
  role: string;
}

export async function generateSchedule(
  input: ScheduleInput
): Promise<{ assignments: AssignmentResult[]; notes: string }> {
  const prompt = buildSchedulePrompt(input);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  return parseScheduleResponse(responseText);
}

function buildSchedulePrompt(input: ScheduleInput): string {
  const monthStr = `${input.year}年${input.month}月`;
  const doctorMap = Object.fromEntries(input.doctors.map((d) => [d.id, d.name]));

  return `你是一位診所排班助理，負責為 ${monthStr} 安排助理的班表。

## 助理名單
${input.assistants
  .map((a) => `- ID: ${a.id}, 姓名: ${a.name}, 技能: ${a.skills.join(", ") || "通用"}${a.maxSessionsPerMonth ? `, 每月上限: ${a.maxSessionsPerMonth}診` : ""}`)
  .join("\n")}

## 助理劃假（希望休假的日期，盡量避開但人力不足時仍可排班）
${
  input.preferenceDays.length === 0
    ? "（無劃假）"
    : input.preferenceDays.map((p) => {
        const s = p.sessionType === "morning" ? "早診" : p.sessionType === "afternoon" ? "午診" : "晚診";
        return `- 助理ID: ${p.assistantId}, 日期: ${p.date}, 診別: ${s}`;
      }).join("\n")
}

## 每位助理當月應排診次數（必須精確符合，不可多排也不可少排）
${
  input.sessionQuotas.length === 0
    ? "（未設定，依 maxSessionsPerMonth 限制）"
    : input.sessionQuotas.map((q) => `- 助理ID: ${q.assistantId}, 應排診次: ${q.sessions}`).join("\n")
}

## 強制規則（必須嚴格遵守）
${
  input.specialRules.filter((r) => r.isMandatory).length === 0
    ? "（無強制規則）"
    : input.specialRules.filter((r) => r.isMandatory).map((r) => `- ${r.title}: ${r.description}`).join("\n")
}

## 通融規則（盡量遵守，人力不足時可彈性處理）
${
  input.specialRules.filter((r) => !r.isMandatory).length === 0
    ? "（無通融規則）"
    : input.specialRules.filter((r) => !r.isMandatory).map((r) => `- ${r.title}: ${r.description}`).join("\n")
}

## 診次清單
${input.clinicDays
  .map((day) =>
    day.sessions
      .map((s) => {
        const doctorNames = s.doctorIds
          .map((id) => doctorMap[id])
          .filter(Boolean)
          .join("、");
        return `- 診次ID: ${s.id}, 日期: ${day.date}, 診所: ${s.clinicName || "未指定"}, ${s.sessionType}診 (${s.startTime}-${s.endTime}), 醫師: ${doctorNames || "未指定"}, 需要櫃檯: ${s.counterNeeded}人, 機動: ${s.mobileNeeded}人`;
      })
      .join("\n")
  )
  .join("\n")}

## 排班規則
1. 每位助理一天最多排 2 個診
2. 每週至少休息 2 天
3. 避免同一位助理連續排超過 5 天
4. 公平分配，讓每位助理的班數盡量均等
5. 助理有劃假的日期盡量避開排班，但若人力不足仍可安排（軟性約束，非強制）
8. 若有設定「應排診次數」，必須嚴格達到每位助理的指定診次數（不多不少）
9. 每位助理在同一個診次中只能擔任一個職位（跟診、機動或櫃檯），同一天不同診次可以再排
6. 技能要匹配（counter 技能排櫃檯，mobile 技能排機動）
7. 若助理名單中有設定「每月上限」，該助理本月的總診次數不得超過此上限

## 輸出格式
請以 JSON 格式回覆，包含以下欄位：
{
  "assignments": [
    {
      "clinicSessionId": "診次ID",
      "assistantId": "助理ID",
      "role": "counter 或 mobile"
    }
  ],
  "notes": "排班說明，包含注意事項或無法滿足的需求"
}

只輸出 JSON，不要有其他文字。`;
}

// Bug 5 fix: 用非貪婪方式找第一個完整 JSON 物件，避免多個 JSON 結構時擷取錯誤
function parseScheduleResponse(responseText: string): {
  assignments: AssignmentResult[];
  notes: string;
} {
  try {
    // 找第一個 { 到對應的 } (計數大括號深度)
    const start = responseText.indexOf("{");
    if (start === -1) throw new Error("No JSON found");
    let depth = 0;
    let end = -1;
    for (let i = start; i < responseText.length; i++) {
      if (responseText[i] === "{") depth++;
      else if (responseText[i] === "}") {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end === -1) throw new Error("Unmatched braces");
    const parsed = JSON.parse(responseText.slice(start, end + 1));
    if (!Array.isArray(parsed.assignments)) throw new Error("Invalid format");
    return parsed;
  } catch {
    return {
      assignments: [],
      notes: `AI 回應解析失敗，請重試。原始回應：${responseText.substring(0, 200)}`,
    };
  }
}
