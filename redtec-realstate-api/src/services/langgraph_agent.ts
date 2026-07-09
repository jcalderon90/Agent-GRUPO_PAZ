import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { MessagesAnnotation, StateGraph, START, END } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import { env } from '../config/env.js';
import type { TenantDb } from '../db/client.js';

// Define our tools
const searchKnowledgeTool = tool(
  async ({ query }, config) => {
    const tenantDb = config.configurable?.tenantDb as TenantDb;
    return await tenantDb.searchKnowledge(query);
  },
  {
    name: 'search_knowledge',
    description: 'Busca información en la base de conocimiento del proyecto inmobiliario, tales como precios, ubicación, amenidades o especificaciones técnicas.',
    schema: z.object({
      query: z.string().describe('Consulta de búsqueda en lenguaje natural'),
    }),
  }
);

const saveContactDataTool = tool(
  async ({ field, value }, config) => {
    const tenantDb = config.configurable?.tenantDb as TenantDb;
    const contactId = config.configurable?.contactId as string;
    await tenantDb.updateContactField(contactId, field, value);
    return { success: true, message: `Campo ${field} actualizado con el valor: ${value}` };
  },
  {
    name: 'save_contact_data',
    description: 'Guarda información capturada del cliente durante la conversación como su correo (email), presupuesto (budget), interés (interest), o notas (notes).',
    schema: z.object({
      field: z.enum(['name', 'email', 'phone', 'interest', 'budget', 'notes']).describe('Nombre del campo a actualizar'),
      value: z.string().describe('Valor a guardar para el campo'),
    }),
  }
);

const tools = [searchKnowledgeTool, saveContactDataTool];
const toolNode = new ToolNode(tools);

// Define LLM model (either Anthropic Claude or OpenAI)
function getModel() {
  if (env.OPENROUTER_API_KEY) {
    return new ChatOpenAI({
      apiKey: env.OPENROUTER_API_KEY,
      configuration: {
        baseURL: 'https://openrouter.ai/api/v1',
        defaultHeaders: {
          'HTTP-Referer': 'https://redtecsystems.com',
          'X-Title': 'RedTec RealEstate Agent',
        }
      },
      modelName: env.CLAUDE_MODEL,
      temperature: 0.2,
    });
  } else {
    // Fallback to native Anthropic Claude
    return new ChatAnthropic({
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      modelName: 'claude-3-5-sonnet-latest',
      temperature: 0.2,
    });
  }
}

// Router to decide whether to continue calling tools or end
function shouldContinue(state: typeof MessagesAnnotation.State) {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  
  if (lastMessage?.additional_kwargs?.tool_calls?.length || (lastMessage as any).tool_calls?.length) {
    return 'tools';
  }
  return END;
}

// Node that calls the LLM
async function callModel(state: typeof MessagesAnnotation.State, config: any) {
  const { messages } = state;
  const systemPrompt = config.configurable?.systemPrompt || 'Eres un asistente útil de bienes raíces.';
  
  const model = getModel().bindTools(tools);
  
  // Format history messages
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages,
  ];
  
  const response = await model.invoke(formattedMessages, config);
  return { messages: [response] };
}

// Build the workflow
const workflow = new StateGraph(MessagesAnnotation)
  .addNode('agent', callModel)
  .addNode('tools', toolNode)
  .addEdge(START, 'agent')
  .addConditionalEdges('agent', shouldContinue)
  .addEdge('tools', 'agent');

// Compile the graph
export const langgraphAgent = workflow.compile();

// Main function to run the agent loop
export async function runLangGraphAgent(
  input: { contactId: string; newMessage: string; channel: string },
  tenantDb: TenantDb
): Promise<string> {
  const { contactId, newMessage, channel } = input;

  // 1. Get history, config, and ensure client exists in database
  const [history, config] = await Promise.all([
    tenantDb.getConversationHistory(contactId, 20),
    tenantDb.getClientConfig(),
  ]);

  await tenantDb.getOrCreateContact(contactId, channel);

  // 2. Prepare system prompt
  let systemPrompt = config.system_prompt ?? 'Eres Sofía, una asesora inmobiliaria experta y súper atenta.';
  systemPrompt += `\n\nEl nombre del agente es: ${config.agent_name || 'Asistente'}.`;
  
  // 3. Format history to LangChain messages format
  const langchainHistory = history.map(m => {
    if (m.role === 'user') {
      return { role: 'user', content: m.content };
    } else {
      return { role: 'assistant', content: m.content };
    }
  });

  // Add the user's new message to the list of inputs
  const inputs = {
    messages: [
      ...langchainHistory,
      { role: 'user', content: newMessage }
    ]
  };

  // 4. Run the compiled graph with current tenant contexts in configurable config
  const result = await langgraphAgent.invoke(inputs, {
    configurable: {
      tenantDb,
      contactId,
      channel,
      systemPrompt,
    }
  });

  // 5. Save the user and assistant message to the database for persistence
  const lastMessage = result.messages[result.messages.length - 1];
  const responseText = lastMessage.content as string;

  await Promise.all([
    tenantDb.saveMessage(contactId, 'user', newMessage),
    tenantDb.saveMessage(contactId, 'assistant', responseText),
  ]);

  return responseText;
}
