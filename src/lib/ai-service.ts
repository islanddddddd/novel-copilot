import type { AIConfig, AIRequest, AIResponse, AIOperation, WritingStyle } from './types';
import type { AIModeSetting } from '../store/useAIStore';

const PROVIDER_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  deepseek: 'https://api.deepseek.com/v1',
  siliconflow: 'https://api.siliconflow.cn/v1',
};

function getBaseUrl(config: AIConfig): string {
  if (config.provider === 'custom') return config.baseUrl || '';
  return PROVIDER_URLS[config.provider] || config.baseUrl || '';
}

function supportsReasoning(config: AIConfig): boolean {
  return config.model.includes('o1') || config.model.includes('o3') || config.model.includes('reasoner');
}

const DEFAULT_TEMPLATES: Record<string, string> = {
  polish: `你是一位专业的小说编辑。请对以下段落进行润色，保持原文的意思和情节，但提升文笔质量。\n\n{{STYLE}}\n\n原文：\n{{TEXT}}\n\n请直接返回润色后的文本，不要添加任何解释或标注。`,
  expand: `你是一位专业的小说作者。请对以下段落进行扩写，在保持原有情节和风格的基础上，增加更多细节描写、环境渲染、心理活动或对话，使内容更加丰富饱满。\n\n{{STYLE}}\n\n原文：\n{{TEXT}}\n\n请直接返回扩写后的文本，不要添加任何解释或标注。`,
  review: `你是一位专业的小说审稿人。请审查以下段落，检查：\n1. 是否与前文大纲和设定一致\n2. 是否存在逻辑矛盾或设定冲突\n3. 伏笔是否得到呼应\n4. 文笔质量和改进建议\n\n大纲：\n{{OUTLINE}}\n\n设定：\n{{SETTINGS}}\n\n前文：\n{{PREVIOUS}}\n\n当前段落：\n{{TEXT}}\n\n请简要返回审查结果。`,
  custom: `{{CUSTOM_PROMPT}}\n\n原文：\n{{TEXT}}\n\n请直接返回处理后的文本，不要添加任何解释或标注。`,
};

export function getDefaultTemplate(operation: AIOperation): string {
  return DEFAULT_TEMPLATES[operation] || DEFAULT_TEMPLATES.polish;
}

export async function sendAIRequest(
  config: AIConfig,
  request: AIRequest,
  style?: WritingStyle,
  promptTemplate?: string,
  modeSetting?: AIModeSetting
): Promise<AIResponse> {
  try {
    const baseUrl = getBaseUrl(config);
    if (!baseUrl) {
      return { success: false, result: '', error: '未配置 API 地址' };
    }
    if (!config.apiKey) {
      return { success: false, result: '', error: '未配置 API Key' };
    }

    let prompt = promptTemplate || getDefaultTemplate(request.operation);

    // Replace placeholders
    prompt = prompt.replace('{{TEXT}}', request.text);
    prompt = prompt.replace(
      '{{STYLE}}',
      style ? `文风要求：${style.promptFragment}` : ''
    );
    prompt = prompt.replace('{{OUTLINE}}', request.context?.outline || '（暂无大纲）');
    prompt = prompt.replace(
      '{{SETTINGS}}',
      request.context?.settings?.join('\n') || '（暂无设定）'
    );
    prompt = prompt.replace(
      '{{PREVIOUS}}',
      request.context?.previousParagraphs?.join('\n\n') || '（无前文）'
    );
    prompt = prompt.replace('{{CUSTOM_PROMPT}}', request.customPrompt || '');

    // Build request body with mode-specific parameters
    const body: Record<string, unknown> = {
      model: config.model || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的小说写作助手，擅长中文文学创作。',
        },
        { role: 'user', content: prompt },
      ],
    };

    // Apply mode settings if provided
    if (modeSetting) {
      body.temperature = modeSetting.temperature;
      if (modeSetting.maxTokens !== null) {
        body.max_tokens = modeSetting.maxTokens;
      }
      // Enable reasoning for providers that support it
      if (modeSetting.enableReasoning && supportsReasoning(config)) {
        if (config.provider === 'openai' && config.model.startsWith('o')) {
          body.reasoning_effort = 'high';
        } else if (config.provider === 'deepseek' && config.model.includes('reasoner')) {
          // DeepSeek reasoner handles reasoning automatically
        }
      }
    } else {
      body.temperature = 0.7;
      body.max_tokens = 2000;
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, result: '', error: `API 错误: ${error}` };
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || '';
    return { success: true, result };
  } catch (err) {
    return {
      success: false,
      result: '',
      error: err instanceof Error ? err.message : '未知错误',
    };
  }
}

export async function learnStyleFromText(text: string, config: AIConfig): Promise<Partial<WritingStyle>> {
  const prompt = `请分析以下文本的写作风格，提取其特征。请用简洁的语言描述这种文风的特点，并总结为一段可用于指导AI写作的提示词片段。

文本样本：
${text.slice(0, 3000)}

请以JSON格式返回：
{
  "description": "文风特点描述（50字以内）",
  "promptFragment": "用于AI提示词的风格描述（100字以内）"
}`;

  const response = await fetch(`${getBaseUrl(config)}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: '你是一位文学分析专家，擅长分析写作风格。' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    throw new Error('文风学习失败');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || '{}';
  
  try {
    // Try to parse JSON from the response
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return {
        description: parsed.description || '自定义文风',
        promptFragment: parsed.promptFragment || '',
      };
    }
  } catch {
    // Fallback
  }

  return {
    description: '自定义文风',
    promptFragment: content.slice(0, 200),
  };
}
