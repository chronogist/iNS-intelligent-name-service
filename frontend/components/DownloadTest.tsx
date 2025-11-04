// Download Test Component
// Add this to any page to test downloading files by root hash

'use client';

import { useState } from 'react';
import { Download, Loader2, FileText, AlertCircle } from 'lucide-react';
import { browserZeroGStorage } from '../lib/0g-storage-browser';

interface DownloadResult {
  success: boolean;
  fileInfo?: any;
  downloadResult?: any;
  error?: string;
}

export default function DownloadTest() {
  const [rootHash, setRootHash] = useState('0xa94376f6449c987a4f1b65082e7db69cb10f7f218605fc5bd7f5138abac7cc31');
  const [isDownloading, setIsDownloading] = useState(false);
  const [result, setResult] = useState<DownloadResult | null>(null);

  const validateRootHash = (hash: string): boolean => {
    return /^0x[a-fA-F0-9]{64}$/.test(hash);
  };

  const downloadFile = async () => {
    if (!validateRootHash(rootHash)) {
      setResult({
        success: false,
        error: 'Invalid root hash format. Expected 64-character hex string with 0x prefix'
      });
      return;
    }

    setIsDownloading(true);
    setResult(null);

    try {
      console.log('🔄 Starting download process for:', rootHash);
      
      // Step 1: Get file info
      console.log('📊 Getting file information...');
      const fileInfo = await browserZeroGStorage.getFileInfo(rootHash);
      console.log('✅ File info retrieved:', fileInfo);

      // Step 2: Attempt download
      console.log('📥 Attempting download...');
      const downloadResult = await browserZeroGStorage.downloadData(rootHash);
      console.log('✅ Download completed:', downloadResult);

      setResult({
        success: true,
        fileInfo,
        downloadResult
      });

    } catch (error: any) {
      console.error('❌ Download failed:', error);
      setResult({
        success: false,
        error: error?.message || 'Unknown error occurred'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Download className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">0G Storage File Download Test</h2>
        </div>

        {/* Root Hash Input */}
        <div className="mb-6">
          <label htmlFor="rootHash" className="block text-sm font-medium text-gray-700 mb-2">
            Root Hash
          </label>
          <input
            id="rootHash"
            type="text"
            value={rootHash}
            onChange={(e) => setRootHash(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter a 64-character hex string starting with 0x
          </p>
        </div>

        {/* Download Button */}
        <button
          onClick={downloadFile}
          disabled={isDownloading || !rootHash.trim()}
          className={`w-full p-3 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
            isDownloading || !rootHash.trim()
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Download File</span>
            </>
          )}
        </button>

        {/* Results */}
        {result && (
          <div className="mt-6">
            {result.success ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <FileText className="w-5 h-5 text-green-600 mr-2" />
                  <h3 className="font-semibold text-green-800">Download Successful!</h3>
                </div>
                
                {result.fileInfo && (
                  <div className="mb-4">
                    <h4 className="font-medium text-green-800 mb-2">File Information:</h4>
                    <pre className="bg-green-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.fileInfo, null, 2)}
                    </pre>
                  </div>
                )}

                {result.downloadResult && (
                  <div>
                    <h4 className="font-medium text-green-800 mb-2">Download Result:</h4>
                    <pre className="bg-green-100 p-2 rounded text-xs overflow-x-auto">
                      {JSON.stringify(result.downloadResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <h3 className="font-semibold text-red-800">Download Failed</h3>
                </div>
                <p className="text-red-700 text-sm">{result.error}</p>
                
                <div className="mt-3 text-xs text-red-600">
                  <p><strong>Possible reasons:</strong></p>
                  <ul className="list-disc list-inside mt-1">
                    <li>File was never uploaded to 0G Storage</li>
                    <li>Root hash is incorrect or invalid</li>
                    <li>File is not available on current storage nodes</li>
                    <li>Network connectivity issues</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Usage Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Usage Instructions:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Enter a valid root hash from a previously uploaded file</li>
            <li>• Click "Download File" to attempt retrieval</li>
            <li>• Check browser console for detailed logs</li>
            <li>• Results will show file info and download status</li>
          </ul>
        </div>

        {/* Sample Hash Info */}
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-2">Sample Root Hash:</h3>
          <p className="text-xs text-gray-600 font-mono break-all">
            {rootHash}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            This is the root hash you provided - try downloading it!
          </p>
        </div>
      </div>
    </div>
  );
}