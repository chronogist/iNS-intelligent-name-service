// Test page for downloading files from 0G Storage
// Now uses backend API endpoints for 0G Storage operations

import DownloadTest from '../../../components/DownloadTest';

export default function TestDownloadPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            0G Storage Download Test
          </h1>
          <p className="text-gray-600">
            Test downloading files from 0G Storage using root hash
          </p>
        </div>

        <DownloadTest />

        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">🔍 File Query Process</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Validates root hash format</li>
                <li>2. Queries storage nodes for file info</li>
                <li>3. Checks file availability</li>
                <li>4. Returns file metadata</li>
              </ol>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-2">📥 Download Process</h3>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Locates file on storage network</li>
                <li>2. Initiates download from nodes</li>
                <li>3. Verifies file integrity</li>
                <li>4. Returns download status</li>
              </ol>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Uses backend API for 0G Storage operations</li>
              <li>• Full download requires the file to have been uploaded first</li>
              <li>• Check browser console for detailed operation logs</li>
              <li>• Backend must be running for this to work</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}