import { NextRequest } from 'next/server';

interface LLMCallOptions {
  provider: 'openrouter' | 'gemini' | 'groq' | 'together' | 'azure';
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  tools?: Array<any>;
  tool_choice?: string;
}

interface ProviderConfig {
  url: (model: string) => string;
  headers: () => Record<string, string>;
  formatMessages: (messages: LLMCallOptions['messages']) => any;
  formatTools?: (tools: any[]) => any;
  extractResponse: (data: any) => string | null;
  extractToolCalls?: (data: any) => any[] | null;
}

// SECURITY FIX: API Env Checks startup validation
export function validateEnv() {
  if (!process.env.OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY is missing');
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is missing');
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is missing');
  if (!process.env.TOGETHER_API_KEY) throw new Error('TOGETHER_API_KEY is missing');
  if (!process.env.AZURE_OPENAI_API_KEY) throw new Error('AZURE_OPENAI_API_KEY is missing');
}

const providerConfigs: Record<string, ProviderConfig> = {
  openrouter: {
    url: () => 'https://openrouter.ai/api/v1/chat/completions',
    headers: () => ({
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'DevSentinel AI',
      'Content-Type': 'application/json'
    }),
    formatMessages: (messages) => messages,
    formatTools: (tools) => tools,
    extractResponse: (data) => {
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      return null;
    },
    extractToolCalls: (data) => {
      if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.tool_calls) {
        return data.choices[0].message.tool_calls;
      }
      return null;
    }
  },
  gemini: {
    url: (model) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
    headers: () => ({
      'Content-Type': 'application/json'
    }),
    formatMessages: (messages) => ({
      contents: messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    }),
    formatTools: (tools) => {
      return {
        function_declarations: tools.map(tool => ({
          name: tool.function.name,
          description: tool.function.description,
          parameters: tool.function.parameters
        }))
      };
    },
    extractResponse: (data) => {
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      }
      return null;
    },
    extractToolCalls: (data) => {
      if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
        const functionCalls = data.candidates[0].content.parts
          .filter((part: any) => part.functionCall)
          .map((part: any) => ({
            function: {
              name: part.functionCall.name,
              arguments: JSON.stringify(part.functionCall.args)
            }
          }));
        return functionCalls.length > 0 ? functionCalls : null;
      }
      return null;
    }
  },
  groq: {
    url: () => 'https://api.groq.com/openai/v1/chat/completions',
    headers: () => ({
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    }),
    formatMessages: (messages) => messages,
    formatTools: (tools) => tools,
    extractResponse: (data) => {
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      return null;
    },
    extractToolCalls: (data) => {
      if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.tool_calls) {
        return data.choices[0].message.tool_calls;
      }
      return null;
    }
  },
  together: {
    url: () => 'https://api.together.xyz/v1/chat/completions',
    headers: () => ({
      'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
      'Content-Type': 'application/json'
    }),
    formatMessages: (messages) => messages,
    formatTools: (tools) => tools,
    extractResponse: (data) => {
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      return null;
    },
    extractToolCalls: (data) => {
      if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.tool_calls) {
        return data.choices[0].message.tool_calls;
      }
      return null;
    }
  },
  azure: {
    url: () => `${process.env.AZURE_OPENAI_ENDPOINT || 'https://YOUR_RESOURCE_NAME.openai.azure.com'}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'YOUR_DEPLOYMENT_NAME'}/chat/completions?api-version=2024-06-01`,
    headers: () => ({
      'api-key': `${process.env.AZURE_OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    }),
    formatMessages: (messages) => messages,
    formatTools: (tools) => tools,
    extractResponse: (data) => {
      if (data && data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content;
      }
      return null;
    },
    extractToolCalls: (data) => {
      if (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.tool_calls) {
        return data.choices[0].message.tool_calls;
      }
      return null;
    }
  }
};

export async function callLLM({
  provider,
  model,
  messages,
  temperature = 0.7,
  maxTokens = 2048,
  tools,
  tool_choice
}: LLMCallOptions): Promise<string> {
  try {
    const config = providerConfigs[provider];
    if (!config) {
      throw new Error(`Unsupported provider`);
    }

    const url = config.url(model);
    const headers = config.headers();

    const requestBody: any = {
      model,
      messages: config.formatMessages(messages),
      temperature,
      max_tokens: maxTokens
    };
    
    // Add tools if provided
    if (tools && tools.length > 0) {
      requestBody.tools = config.formatTools ? config.formatTools(tools) : tools;
      if (tool_choice) {
        requestBody.tool_choice = tool_choice;
      }
    };

    // Remove model from body for Gemini as it's in the URL
    if (provider === 'gemini') {
      delete requestBody.model;
    }

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LLM API error (${response.status})`);
    }

    const data = await response.json();
    const content = config.extractResponse(data);

    if (!content) {
      // Check if there are tool calls
      if (config.extractToolCalls) {
        const toolCalls = config.extractToolCalls(data);
        if (toolCalls && toolCalls.length > 0) {
          // Return tool calls as JSON string
          return JSON.stringify({ tool_calls: toolCalls });
        }
      }
      
      throw new Error('No content returned from LLM');
    }

    return content;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`LLM call timed out. Please try again.`);
    }
    // SECURITY FIX: Never expose which keys are missing in API responses
    throw new Error(`Failed to call LLM.`);
  }
}

export async function callLLMWithTools({
  provider,
  model,
  messages,
  tools,
  tool_choice = 'auto',
  temperature = 0.7,
  maxTokens = 2048
}: Omit<LLMCallOptions, 'tools' | 'tool_choice'> & { tools: Array<any>, tool_choice?: string }): Promise<any> {
  try {
    const config = providerConfigs[provider];
    if (!config) {
      throw new Error(`Unsupported provider`);
    }

    const url = config.url(model);
    const headers = config.headers();

    const requestBody: any = {
      model,
      messages: config.formatMessages(messages),
      temperature,
      max_tokens: maxTokens
    };
    
    // Add tools
    if (tools && tools.length > 0) {
      requestBody.tools = config.formatTools ? config.formatTools(tools) : tools;
      if (tool_choice) {
        requestBody.tool_choice = tool_choice;
      }
    };

    // Remove model from body for Gemini as it's in the URL
    if (provider === 'gemini') {
      delete requestBody.model;
    }

    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`LLM API error (${response.status})`);
    }

    const data = await response.json();
    
    // Check if there are tool calls
    if (config.extractToolCalls) {
      const toolCalls = config.extractToolCalls(data);
      if (toolCalls && toolCalls.length > 0) {
        return { tool_calls: toolCalls, message: data };
      }
    }
    
    // Otherwise return regular content
    const content = config.extractResponse(data);
    
    if (!content) {
      throw new Error('No content returned from LLM');
    }

    return { content };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`LLM call timed out. Please try again.`);
    }
    throw new Error(`Failed to call LLM.`);
  }
}