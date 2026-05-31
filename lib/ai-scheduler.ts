import Anthropic from "@anthropic-ai/sdk";

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
      doctorName?: string;
      counterNeeded: number;
      mobileNeeded: number;
    }[];
  }[];
  assistants: {
    id: string;
    name: string;
    skills: string[];
  }[];
  leaveRequests: {
    assistantId: string;
    date: string;
  }[];
  specialRules: {
    title: string;
    description: string;
    ruleType: string;
    config: string;
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
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";

  return parseScheduleResponse(responseText);
}

function buildSchedulePrompt(input: ScheduleInput): string {
  const monthStr = `${input.year}年${input.month}月`;

  return `你是一位診所排班助理，負責為 ${monthStr} 安排助理的班表。

## 助理名單
${input.assistants
  .map(
    (a) =>
      `- ID: ${a.id}, 姓名: ${a.name}, 技能: ${a.skills.join(", ") || "通用"}`
  )
  .join("\n")}

## 請假申請（這些日期不能排班）
${
  input.leaveRequests.length === 0
    ? "（無請假）"
    : input.leaveRequests.map((l) => `- 助理ID: ${l.assistantId}, 日期: ${l.date}`).join("\n")
}

## 特殊規則
${
  input.specialRules.length === 0
    ? "（無特殊規則）"
    : input.specialRules.map((r) => `- ${r.title}: ${r.description}`).join("\n")
}

## 診次清單
${input.clinicDays
  .map((day) =>
    day.sessions
      .map(
        (s) =>
          `- 診次ID: ${s.id}, 日期: ${day.date}, ${s.sessionType}診 (${s.startTime}-${s.endTime}), 醫師: ${s.doctorName || "未指定"}, 需要櫃檯: ${s.counterNeeded}人, 機動: ${s.mobileNeeded}人`
      )
      .join("\n")
  )
  .join("\n")}

## 排班規則
1. 每位助理一天最多排 2 個診
2. 同一天不能有超過連續 3 個診
3. 每週至少休息 2 天
4. 避免同一位助理連續排超過 5 天
5. 公平分配，讓每位助理的班數盡量均等
6. 有請假的日期不排班
7. 技能要匹配（counter 技能排櫃檯，mobile 技能排機動）

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

function parseScheduleResponse(responseText: string): {
  assignments: AssignmentResult[];
  notes: string;
} {
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    return JSON.parse(jsonMatch[0]);
  } catch {
    return {
      assignments: [],
      notes: `AI 回應解析失敗，請重試。原始回應：${responseText.substring(0, 200)}`,
    };
  }
}
