'use client';

import { useState } from 'react';
import {
  Key,
  Github,
  Bell,
  Palette,
  Save,
  Zap
} from 'lucide-react';

export default function SettingsPage() {
  const [githubToken, setGithubToken] = useState('');
  const [azureOpenaiKey, setAzureOpenaiKey] = useState('');
  const [azureOpenaiEndpoint, setAzureOpenaiEndpoint] = useState('');
  const [azureOpenaiDeployment, setAzureOpenaiDeployment] = useState('');
  const [azureContentSafetyKey, setAzureContentSafetyKey] = useState('');
  const [azureContentSafetyEndpoint, setAzureContentSafetyEndpoint] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [llmTestStatus, setLlmTestStatus] = useState<{ status: 'idle' | 'testing' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save the settings to a backend
    const settings = {
      githubToken,
      azureOpenaiKey,
      azureOpenaiEndpoint,
      azureOpenaiDeployment,
      azureContentSafetyKey,
      azureContentSafetyEndpoint,
      notifications,
      darkMode
    };

    // console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  const testLlmConnectivity = async () => {
    setLlmTestStatus({ status: 'testing', message: 'Testing LLM connectivity...' });

    try {
      const response = await fetch('/api/test-llm');
      const data = await response.json();

      if (data.success) {
        setLlmTestStatus({
          status: 'success',
          message: 'All LLM providers are working correctly!'
        });
      } else {
        setLlmTestStatus({
          status: 'error',
          message: `LLM test failed: ${data.error || 'Unknown error'}`
        });
      }
    } catch (error) {
      setLlmTestStatus({
        status: 'error',
        message: `LLM test failed: ${error instanceof Error ? error.message : 'Connection error'}`
      });
    }
  };

  return (
    <div className="py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Configure your DevSentinel AI preferences
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden mb-6">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">LLM Configuration</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Test and configure your LLM providers
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white">Test LLM Connectivity</h4>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Verify that all LLM providers are properly configured
              </p>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button
                onClick={testLlmConnectivity}
                disabled={llmTestStatus.status === 'testing'}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap className="mr-2 h-4 w-4" />
                {llmTestStatus.status === 'testing' ? 'Testing...' : 'Test LLM Connectivity'}
              </button>
            </div>
          </div>

          {llmTestStatus.status !== 'idle' && (
            <div className={`mt-4 p-4 rounded-md ${llmTestStatus.status === 'success' ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'}`}>
              <p className={`text-sm font-medium ${llmTestStatus.status === 'success' ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
                {llmTestStatus.message}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Settings</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your account preferences and integrations
          </p>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Integrations</h4>

              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Github className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <label htmlFor="github-token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      GitHub Personal Access Token
                    </label>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Used to access private repositories. Generate a token with repo scope.
                    </p>
                    <div className="mt-2">
                      <input
                        type="password"
                        id="github-token"
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        onBlur={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_************************************"
                        className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <label htmlFor="azure-openai-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Azure OpenAI API Key
                    </label>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      API key for Azure OpenAI service.
                    </p>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="azure-openai-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          API Key
                        </label>
                        <input
                          type="password"
                          id="azure-openai-key"
                          value={azureOpenaiKey}
                          onChange={(e) => setAzureOpenaiKey(e.target.value)}
                          onBlur={(e) => setAzureOpenaiKey(e.target.value)}
                          placeholder="Azure OpenAI API key"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="azure-openai-endpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Endpoint
                        </label>
                        <input
                          type="text"
                          id="azure-openai-endpoint"
                          value={azureOpenaiEndpoint}
                          onChange={(e) => setAzureOpenaiEndpoint(e.target.value)}
                          onBlur={(e) => setAzureOpenaiEndpoint(e.target.value)}
                          placeholder="https://your-resource.openai.azure.com"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label htmlFor="azure-openai-deployment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Deployment Name
                      </label>
                      <input
                        type="text"
                        id="azure-openai-deployment"
                        value={azureOpenaiDeployment}
                        onChange={(e) => setAzureOpenaiDeployment(e.target.value)}
                        onBlur={(e) => setAzureOpenaiDeployment(e.target.value)}
                        placeholder="gpt-4"
                        className="block w-full max-w-md px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3 flex-1">
                    <label htmlFor="azure-content-safety-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Azure AI Content Safety Key
                    </label>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      API key for Azure AI Content Safety service.
                    </p>
                    <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="azure-content-safety-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          API Key
                        </label>
                        <input
                          type="password"
                          id="azure-content-safety-key"
                          value={azureContentSafetyKey}
                          onChange={(e) => setAzureContentSafetyKey(e.target.value)}
                          onBlur={(e) => setAzureContentSafetyKey(e.target.value)}
                          placeholder="Azure Content Safety API key"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                      <div>
                        <label htmlFor="azure-content-safety-endpoint" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Endpoint
                        </label>
                        <input
                          type="text"
                          id="azure-content-safety-endpoint"
                          value={azureContentSafetyEndpoint}
                          onChange={(e) => setAzureContentSafetyEndpoint(e.target.value)}
                          onBlur={(e) => setAzureContentSafetyEndpoint(e.target.value)}
                          placeholder="https://your-resource.cognitiveservices.azure.com"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preferences</h4>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Bell className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="notifications" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Email Notifications
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Receive email alerts for critical vulnerabilities
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setNotifications(!notifications)}
                      className={`${notifications ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      <span
                        className={`${notifications ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      >
                        <span
                          className={`${notifications ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200'
                            } absolute inset-0 h-full w-full flex items-center justify-center transition-opacity`}
                          aria-hidden="true"
                        >
                          <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                            <path
                              d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span
                          className={`${notifications ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'
                            } absolute inset-0 h-full w-full flex items-center justify-center transition-opacity`}
                          aria-hidden="true"
                        >
                          <svg className="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-5.707a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                          </svg>
                        </span>
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Palette className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="dark-mode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Dark Mode
                      </label>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enable dark theme for the interface
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setDarkMode(!darkMode)}
                      className={`${darkMode ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-600'
                        } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                    >
                      <span
                        className={`${darkMode ? 'translate-x-5' : 'translate-x-0'
                          } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      >
                        <span
                          className={`${darkMode ? 'opacity-0 ease-out duration-100' : 'opacity-100 ease-in duration-200'
                            } absolute inset-0 h-full w-full flex items-center justify-center transition-opacity`}
                          aria-hidden="true"
                        >
                          <svg className="h-3 w-3 text-gray-400" fill="none" viewBox="0 0 12 12">
                            <path
                              d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                              stroke="currentColor"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span
                          className={`${darkMode ? 'opacity-100 ease-in duration-200' : 'opacity-0 ease-out duration-100'
                            } absolute inset-0 h-full w-full flex items-center justify-center transition-opacity`}
                          aria-hidden="true"
                        >
                          <svg className="h-3 w-3 text-indigo-600" fill="currentColor" viewBox="0 0 12 12">
                            <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-5.707a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                          </svg>
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}