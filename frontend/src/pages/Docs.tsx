import { Terminal } from 'lucide-react';

export default function Docs() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-12">
      <div>
        <h1 className="text-4xl font-extrabold text-white mb-4">API Documentation</h1>
        <p className="text-lg text-gray-400">
          Everything you need to integrate AnyForge-AI into your application.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-[#2A2A2A] pb-2">Authentication</h2>
        <p className="text-gray-300 mb-4">
          All API requests require your API key to be passed in the <code className="bg-[#2A2A2A] px-1.5 py-0.5 rounded text-[#8B5CF6]">X-API-Key</code> header.
        </p>
        <CodeBlock code={`curl -X POST https://api.anyforge.ai/api/v1/generate \\
  -H "X-API-Key: af-your_api_key_here"`} language="bash" />
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-[#2A2A2A] pb-2">Text Extraction <span className="text-[#10B981] ml-2 text-sm px-2 py-0.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 font-mono align-middle">POST /api/v1/generate</span></h2>
        <p className="text-gray-300 mb-4">
          Extract structured JSON from any unstructured text using your custom schema.
        </p>
        <h3 className="text-lg font-semibold text-white mb-2">Request Body (JSON)</h3>
        <ul className="list-disc pl-5 text-gray-400 mb-4 space-y-1">
          <li><code className="text-white">prompt</code> (string, required): The raw text to process.</li>
          <li><code className="text-white">target_schema</code> (string, required): JSON string or plain text description of the output format.</li>
        </ul>
        <CodeBlock code={`{
  "prompt": "Bug: app crashes on iOS 17 when opening settings. Severity: critical.",
  "target_schema": "{\\"title\\": \\"string\\", \\"severity\\": \\"enum: low|medium|high|critical\\"}"
}`} language="json" />

        <h3 className="text-lg font-semibold text-white mt-6 mb-2">Success Response</h3>
        <CodeBlock code={`{
  "result": {
    "title": "App crash on iOS 17 when opening settings",
    "severity": "critical"
  }
}`} language="json" />
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-[#2A2A2A] pb-2">Vision Extraction <span className="text-[#10B981] ml-2 text-sm px-2 py-0.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 font-mono align-middle">POST /api/v1/extract-vision</span></h2>
        <p className="text-gray-300 mb-4">
          Analyze images (receipts, handwritten notes) and map them to your schema.
        </p>
        <h3 className="text-lg font-semibold text-white mb-2">Request Body (JSON)</h3>
        <CodeBlock code={`{
  "image_base64": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=",
  "mime_type": "image/jpeg",
  "target_schema": "{\\"amount\\": \\"number\\", \\"date\\": \\"string\\"}"
}`} language="json" />
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-[#2A2A2A] pb-2">Async Document Extraction <span className="text-[#8B5CF6] ml-2 text-sm px-2 py-0.5 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 font-mono align-middle">POST /api/v1/generate/async</span></h2>
        <p className="text-gray-300 mb-4">
          Offload large document extraction with automatic chunking and PII scrubbing. Great for massive PDFs or books.
        </p>
        <h3 className="text-lg font-semibold text-white mb-2">Request Body (JSON)</h3>
        <ul className="list-disc pl-5 text-gray-400 mb-4 space-y-1">
          <li><code className="text-white">prompt</code> (string, required): The massive raw text to process.</li>
          <li><code className="text-white">target_schema</code> (string, required): JSON string target schema.</li>
          <li><code className="text-white">webhook_url</code> (string, optional): HTTP endpoint to notify upon completion.</li>
        </ul>
        <CodeBlock code={`{
  "prompt": "Massive document content...",
  "target_schema": "{\\"summary\\": \\"string\\"}",
  "webhook_url": "https://your-server.com/webhook"
}`} language="json" />

        <h3 className="text-lg font-semibold text-white mt-6 mb-2">Success Response (Returns Job ID instantly)</h3>
        <CodeBlock code={`{
  "job_id": "123e4567-e89b-12d3-a456-426614174000",
  "status": "queued"
}`} language="json" />

        <h3 className="text-xl font-bold text-white mt-8 mb-4">Check Job Status <span className="text-[#3B82F6] ml-2 text-sm px-2 py-0.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 font-mono align-middle">GET /api/v1/jobs/{'{job_id}'}</span></h3>
        <p className="text-gray-300 mb-4">
          Poll this endpoint to retrieve the extraction results.
        </p>
        <CodeBlock code={`{
  "status": "completed",
  "result": {
    "summary": "Document summary..."
  }
}`} language="json" />
      </section>

      <section>
        <h2 className="text-2xl font-bold text-white mb-4 border-b border-[#2A2A2A] pb-2">Error Codes</h2>
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0F0F0F] border-b border-[#2A2A2A]">
              <tr>
                <th className="px-6 py-3 text-gray-300 font-semibold">Code</th>
                <th className="px-6 py-3 text-gray-300 font-semibold">HTTP</th>
                <th className="px-6 py-3 text-gray-300 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2A2A2A]">
              <tr>
                <td className="px-6 py-3 font-mono text-red-400">missing_api_key</td>
                <td className="px-6 py-3 text-gray-400">401</td>
                <td className="px-6 py-3 text-gray-400">The X-API-Key header is missing.</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-mono text-red-400">invalid_api_key</td>
                <td className="px-6 py-3 text-gray-400">403</td>
                <td className="px-6 py-3 text-gray-400">The key is wrong, inactive, or deleted.</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-mono text-red-400">rate_limit_exceeded</td>
                <td className="px-6 py-3 text-gray-400">429</td>
                <td className="px-6 py-3 text-gray-400">You hit the per-minute or daily quota.</td>
              </tr>
              <tr>
                <td className="px-6 py-3 font-mono text-red-400">extraction_failed</td>
                <td className="px-6 py-3 text-gray-400">500</td>
                <td className="px-6 py-3 text-gray-400">The AI failed to generate valid output.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function CodeBlock({ code, language }: { code: string, language: string }) {
  return (
    <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg overflow-hidden">
      <div className="bg-[#1A1A1A] px-4 py-2 border-b border-[#2A2A2A] flex items-center justify-between">
        <div className="flex items-center text-gray-400 text-xs font-mono uppercase">
          <Terminal className="w-3 h-3 mr-2" /> {language}
        </div>
      </div>
      <pre className="p-4 text-sm font-mono text-gray-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
