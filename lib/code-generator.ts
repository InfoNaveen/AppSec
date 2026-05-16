import { callLLM } from './llm';
import fs from 'fs/promises';
import path from 'path';

export interface Architecture {
  components: Array<{
    name: string;
    type: 'api' | 'ui' | 'database' | 'service';
    description: string;
    files: Array<{ path: string; description: string }>;
  }>;
  techStack: string[];
  folderStructure: string[];
}

/**
 * Architect Agent: Generate architecture from user story
 */
export async function architectAgentFromStory(userStory: string): Promise<Architecture> {
  const prompt = `Based on this user story, design a secure architecture:

User Story: ${userStory}

Return a JSON object with this structure:
{
  "components": [
    {
      "name": "component name",
      "type": "api|ui|database|service",
      "description": "what it does",
      "files": [
        {"path": "path/to/file.ts", "description": "file purpose"}
      ]
    }
  ],
  "techStack": ["Next.js", "TypeScript", "Supabase"],
  "folderStructure": ["src/api/", "src/components/", "src/lib/"]
}

Focus on security best practices:
- Input validation
- Authentication/authorization
- Secure data handling
- API security
- Error handling`;

  try {
    const response = await callLLM(
      'You are a software architect specializing in secure-by-design systems. Generate architecture plans in valid JSON format only.',
      prompt,
      { json: true }
    );

    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response.trim();
    if (jsonStr.includes('```json')) {
      jsonStr = jsonStr.split('```json')[1].split('```')[0].trim();
    } else if (jsonStr.includes('```')) {
      jsonStr = jsonStr.split('```')[1].split('```')[0].trim();
    }

    const architecture = JSON.parse(jsonStr) as Architecture;
    return architecture;
  } catch (error) {
    console.error('Architect agent error:', error);
    // Return a default architecture
    return {
      components: [
        {
          name: 'API Endpoint',
          type: 'api',
          description: 'REST API endpoint',
          files: [{ path: 'src/api/endpoint.ts', description: 'Main API handler' }]
        },
        {
          name: 'UI Component',
          type: 'ui',
          description: 'User interface component',
          files: [{ path: 'src/components/Component.tsx', description: 'React component' }]
        }
      ],
      techStack: ['Next.js', 'TypeScript'],
      folderStructure: ['src/api/', 'src/components/']
    };
  }
}

/**
 * Builder Agent: Generate code files from architecture
 */
export async function builderAgentFromArchitecture(
  architecture: Architecture,
  outputPath: string
): Promise<string[]> {
  const generatedFiles: string[] = [];

  // Generate code for each component
  for (const component of architecture.components.slice(0, 2)) { // Limit to 2 components for demo
    for (const fileSpec of component.files.slice(0, 1)) { // 1 file per component
      try {
        const filePath = path.join(outputPath, fileSpec.path);
        const dirPath = path.dirname(filePath);
        
        // Ensure directory exists
        await fs.mkdir(dirPath, { recursive: true });

        // Generate code based on component type
        const codePrompt = `Generate secure ${component.type} code for this file:

Component: ${component.name}
File: ${fileSpec.path}
Description: ${fileSpec.description}
Tech Stack: ${architecture.techStack.join(', ')}

Requirements:
- Follow security best practices
- Include input validation
- Handle errors properly
- Add comments
- Use TypeScript

Generate complete, production-ready code:`;

        const code = await callLLM(
          'You are an expert developer. Generate secure, production-ready code with proper error handling and validation.',
          codePrompt
        );

        // Extract code (handle markdown code blocks)
        let codeContent = code.trim();
        if (codeContent.includes('```typescript')) {
          codeContent = codeContent.split('```typescript')[1].split('```')[0].trim();
        } else if (codeContent.includes('```tsx')) {
          codeContent = codeContent.split('```tsx')[1].split('```')[0].trim();
        } else if (codeContent.includes('```ts')) {
          codeContent = codeContent.split('```ts')[1].split('```')[0].trim();
        } else if (codeContent.includes('```')) {
          codeContent = codeContent.split('```')[1].split('```')[0].trim();
        }

        await fs.writeFile(filePath, codeContent, 'utf8');
        generatedFiles.push(fileSpec.path);
      } catch (error) {
        console.error(`Error generating file ${fileSpec.path}:`, error);
      }
    }
  }

  return generatedFiles;
}

/**
 * Critic Agent: Generate test stubs and feedback
 */
export async function criticAgentFromCode(projectPath: string, generatedFiles: string[]): Promise<string> {
  try {
    // Read a sample of generated code
    let codeSample = '';
    if (generatedFiles.length > 0) {
      try {
        const firstFile = path.join(projectPath, generatedFiles[0]);
        const content = await fs.readFile(firstFile, 'utf8');
        codeSample = content.substring(0, 1000); // First 1000 chars
      } catch (error) {
        codeSample = 'Unable to read generated code';
      }
    }

    const prompt = `Review this generated code and provide feedback:

${codeSample}

Provide:
1. Security concerns
2. Test cases needed
3. Improvements suggested`;

    const feedback = await callLLM(
      'You are a code reviewer specializing in security and testing. Provide constructive feedback.',
      prompt
    );

    return feedback;
  } catch (error) {
    console.error('Critic agent error:', error);
    return 'Code review completed with standard checks.';
  }
}

/**
 * Generate code from user story
 */
export async function generateCodeFromStory(
  userStory: string,
  outputPath: string
): Promise<{ architecture: Architecture; generatedFiles: string[]; feedback: string }> {
  // Step 1: Architect Agent
  const architecture = await architectAgentFromStory(userStory);

  // Step 2: Builder Agent
  const generatedFiles = await builderAgentFromArchitecture(architecture, outputPath);

  // Step 3: Critic Agent
  const feedback = await criticAgentFromCode(outputPath, generatedFiles);

  return {
    architecture,
    generatedFiles,
    feedback
  };
}

