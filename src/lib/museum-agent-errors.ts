import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError
} from "@supabase/supabase-js";

export type AgentFailureCopy = {
  title: string;
  detail: string;
  status: string;
};

const failureCopy: Record<string, AgentFailureCopy> = {
  invalid_evidence: {
    title: "证据格式与服务端版本不一致",
    detail: "服务端未接受这次馆藏证据；已保留本地答案，请刷新页面后重试。",
    status: "生成服务拒绝了证据格式"
  },
  invalid_request: {
    title: "请求格式未通过校验",
    detail: "生成服务没有接受这次请求；已保留本地档案答案。",
    status: "生成服务请求格式错误"
  },
  unauthorized: {
    title: "生成服务鉴权失败",
    detail: "公开访问密钥与服务端配置不一致；已保留本地答案，请联系维护者。",
    status: "生成服务鉴权失败"
  },
  rate_limited: {
    title: "请求过于频繁",
    detail: "已达到短时请求上限；本地档案答案仍然可用，请稍后再试。",
    status: "生成服务限流"
  },
  daily_budget_reached: {
    title: "今日模型额度已用完",
    detail: "今天的生成调用预算已达到上限；已保留本地档案答案。",
    status: "今日模型额度已用完"
  },
  agent_not_configured: {
    title: "生成模型尚未配置",
    detail: "服务端没有可用的模型密钥；已保留本地档案答案。",
    status: "生成模型尚未配置"
  },
  model_unavailable: {
    title: "DeepSeek 暂时不可用",
    detail: "模型上游没有成功响应；已保留本地档案答案，请稍后重试。",
    status: "DeepSeek 上游暂时不可用"
  },
  model_mismatch: {
    title: "模型回执核验未通过",
    detail: "服务端返回的实际模型与请求模型不一致，因此没有采用生成结果。",
    status: "模型回执不匹配"
  },
  invalid_model_response: {
    title: "模型返回内容不可用",
    detail: "模型响应为空或超出安全范围；已保留本地档案答案。",
    status: "模型返回内容不可用"
  },
  function_unreachable: {
    title: "生成服务暂时无法连接",
    detail: "浏览器未能连接 Supabase Edge Function；已保留本地档案答案。",
    status: "生成服务连接失败"
  },
  relay_unavailable: {
    title: "生成服务网络中转失败",
    detail: "Supabase 中转层没有完成请求；已保留本地答案，请稍后重试。",
    status: "生成服务网络中转失败"
  }
};

const defaultFailure: AgentFailureCopy = {
  title: "生成服务暂时不可用",
  detail: "生成请求没有完成；已保留前两步生成的本地档案答案。你可以稍后重试。",
  status: "生成服务暂时不可用"
};

export function describeAgentFailure(reason: unknown): AgentFailureCopy {
  return typeof reason === "string" ? failureCopy[reason] ?? defaultFailure : defaultFailure;
}

export async function getInvokeFailureReason(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    try {
      const payload = await error.context.json() as { error?: unknown; reason?: unknown };
      if (typeof payload.error === "string") return payload.error;
      if (typeof payload.reason === "string") return payload.reason;
    } catch {
      return "function_http_error";
    }
    return "function_http_error";
  }
  if (error instanceof FunctionsRelayError) return "relay_unavailable";
  if (error instanceof FunctionsFetchError) return "function_unreachable";
  return "agent_unavailable";
}
