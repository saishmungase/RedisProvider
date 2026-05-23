import OpenAI from 'openai';
import query from '@redis/service/root/query.js';
import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema';

const AI = new OpenAI({
    apiKey: process.env.AI_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

async function getStringValue({ port, userPass, key }: any) {
    const command = `GET ${key}`;
    return await query(userPass, port, command);
}

async function searchKeys({ port, userPass, pattern = "*", count = 50 }: any) {
    const command = `SCAN 0 MATCH ${pattern} COUNT ${count}`;
    return await query(userPass, port, command);
}

async function getHashFields({ port, userPass, key }: any) {
    const command = `HGETALL ${key}`;
    return await query(userPass, port, command);
}

async function getListItems({ port, userPass, key, start = 0, end = 20 }: any) {
    const command = `LRANGE ${key} ${start} ${end}`;
    return await query(userPass, port, command);
}

async function getSetMembers({ port, userPass, key }: any) {
    const command = `SMEMBERS ${key}`;
    return await query(userPass, port, command);
}

async function getKeyInfo({ port, userPass, key }: any) {
    const typeCommand = `TYPE ${key}`;
    const ttlCommand = `TTL ${key}`;

    const typeRes: any = await query(userPass, port, typeCommand);
    const ttlRes: any = await query(userPass, port, ttlCommand);

    let sizeCommand = "";
    const typeStr = typeRes?.response || ""; 

    if (typeStr.includes("string")) sizeCommand = `STRLEN ${key}`;
    else if (typeStr.includes("hash")) sizeCommand = `HLEN ${key}`;
    else if (typeStr.includes("list")) sizeCommand = `LLEN ${key}`;
    else if (typeStr.includes("set")) sizeCommand = `SCARD ${key}`;
    else if (typeStr.includes("zset")) sizeCommand = `ZCARD ${key}`;

    const sizeRes = sizeCommand ? await query(userPass, port, sizeCommand) : null;

    return { 
        type: typeRes, 
        ttl: ttlRes, 
        size: sizeRes 
    };
}

export const available_tools: Record<string, any> = {
    "getStringValue": getStringValue,
    "searchKeys": searchKeys,
    "getHashFields": getHashFields,
    "getListItems": getListItems,
    "getSetMembers": getSetMembers,
    "getKeyInfo": getKeyInfo
};

export const SYSTEM_PROMPT = `You are QuickDB-Agent, an elite Agentic AI Redis Expert.
You solve user queries using a strict Chain of Thought state machine: START → PLAN → TOOL → OBSERVE → OUTPUT.

Rules:
- DO NOT Respond to WRITE Queries. If asked, respond with "Sorry, I can only perform read operations."
- Do Not Respond to Any Question Other Than redis
- Output ONLY strictly valid JSON. No prose, no markdown formatting, no backticks.
- Output ONLY ONE step at a time per response. Never output an array.
- You MUST use at least 1 PLAN step before any TOOL or OUTPUT.
- After every TOOL step, wait for the OBSERVE message from the system before continuing.
- For OUTPUT, write a clean & crisp human-readable summary.

JSON Format:
{"step": "START" | "PLAN" | "TOOL" | "OUTPUT", "content": "string", "tool": "string", "input": {}}
Note: "tool" and "input" are only required when step is "TOOL". The "input" MUST be a JSON object.

AVAILABLE TOOLS:
1. getStringValue({ port, userPass, key })
2. searchKeys({ port, userPass, pattern, count })
3. getHashFields({ port, userPass, key })
4. getListItems({ port, userPass, key, start, end })
5. getSetMembers({ port, userPass, key })
6. getKeyInfo({ port, userPass, key })

Example:
User: What is the Value Of Key hey? (port: 7000, userPass: sjfkslf)
{"step": "START", "content": "User wants to find the value of key hey"}
{"step": "PLAN", "content": "Ok So User Wants me to Get The Value of key 'hey', we have a function called getStringValue"}
{"step": "TOOL", "tool": "getStringValue", "input": {"port": 7000, "userPass": "sjfkslf", "key": "hey"}, "content": "Fetching hey key value."}
[OBSERVE arrives]
{"step": "OUTPUT", "content": "Value of Key 'hey' On Your Instance is '123'."}`;

const ai_response_format = z.object({
    step : z.enum(["START", "PLAN", "TOOL", "OUTPUT", "OBSERVE"]),
    content : z.string().optional(),
    tool : z.string().optional(),
    input: z.record(z.any()).optional()
})

// {
//     step = "START" | "PLAN" | "TOOL" | "OUTPUT" | "OBSERVE",
//     content : string,
//     tool : string,
//     input : {} 
// }

export const aiQuery = async (message_history: any[]) => {
    const response = await AI.chat.completions.create({
        model: "gemini-3.1-flash-lite-preview",
        messages: message_history,
        response_format: {
            type: "json_schema",
            json_schema: {
                name : 'Agent-Response',
                schema : zodToJsonSchema(ai_response_format)
            }
        }
    });

    return ai_response_format.parse(JSON.parse(response.choices[0]?.message.content!)
);;
};