import React, { useState } from 'react';
import { Camera, X } from 'lucide-react';

const QRCodeTest = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedCode, setScannedCode] = useState('');
  const [scanError, setScanError] = useState('');
  const [success, setSuccess] = useState('');
  const videoRef = React.useRef(null);
  const streamRef = React.useRef(null);

  const testQRData = {
    bookingId: '507f1f77bcf86cd799439011',
    bookingCode: '1234',
    turfId: '507f1f77bcf86cd799439012',
    date: '2024-01-15',
    startTime: '10:00',
    endTime: '12:00'
  };

  const generateTestQR = () => {
    const qrData = JSON.stringify(testQRData);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    return qrUrl;
  };

  const verifyAndCheckIn = async (code) => {
    try {
      setScanError('');
      console.log('🔍 Test: Verifying booking code:', code);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('✅ Test: Booking verified successfully');
      setSuccess(`Test booking verified! Code: ${code}`);
      setTimeout(() => setSuccess(''), 3000);
      setShowScanner(false);
      setScannedCode(String(code || ''));
    } catch (e) {
      console.error('❌ Test verification error:', e);
      setScanError('Test verification failed');
    }
  };

  // Scanner controls
  React.useEffect(() => {
    const startScanner = async () => {
      try {
        if (!showScanner) return;
        setScanError('');
        setScannedCode('');
        if ('mediaDevices' in navigator) {
          streamRef.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
          if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            await videoRef.current.play();
          }
          if ('BarcodeDetector' in window) {
            const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
            const tick = async () => {
              if (!showScanner) return;
              try {
                if (videoRef.current?.readyState === 4) {
                  const detections = await detector.detect(videoRef.current);
                  if (detections && detections.length) {
                    const raw = detections[0].rawValue || '';
                    console.log('🔍 Test: QR Code detected:', raw);
                    
                    let code = null;
                    
                    // Try to parse as JSON first
                    try {
                      const parsed = JSON.parse(raw);
                      console.log('🔍 Test: Parsed QR data:', parsed);
                      
                      // Check for bookingCode in various possible structures
                      if (parsed.bookingCode) {
                        code = parsed.bookingCode;
                      } else if (parsed.bookingId) {
                        code = parsed.bookingId;
                      }
                    } catch (e) {
                      // If not JSON, treat as plain text booking code
                      console.log('🔍 Test: QR data is not JSON, treating as plain text');
                      code = raw.trim();
                    }
                    
                    if (code) {
                      console.log('🔍 Test: Using booking code:', code);
                      await verifyAndCheckIn(code);
                    } else {
                      console.log('❌ Test: No valid booking code found in QR data');
                      setScanError('Invalid QR code format. Please scan a valid booking QR code.');
                    }
                  }
                }
              } catch {}
              requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
          }
        }
      } catch (e) {
        setScanError('Camera not available. Enter code manually.');
      }
    };
    startScanner();
    return () => {
      if (streamRef.current) { 
        streamRef.current.getTracks().forEach(t => t.stop()); 
        streamRef.current = null; 
      }
    };
  }, [showScanner]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">QR Code Verification Test</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Test QR Code Data:</h3>
        <pre className="text-sm bg-white p-2 rounded border overflow-x-auto">
          {JSON.stringify(testQRData, null, 2)}
        </pre>
      </div>

      <div className="mb-6 text-center">
        <h3 className="font-semibold mb-2">Test QR Code:</h3>
        <img 
          src={generateTestQR()} 
          alt="Test QR Code" 
          className="mx-auto border rounded"
        />
        <p className="text-sm text-gray-600 mt-2">Scan this QR code to test the verification</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setShowScanner(true)} 
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Camera className="h-4 w-4 mr-2" /> Test Scanner
        </button>
        <button 
          onClick={() => verifyAndCheckIn('1234')} 
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test Manual Entry
        </button>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded">
          {success}
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Test QR Scanner</h3>
              <button onClick={() => setShowScanner(false)} className="p-2 rounded hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="rounded-lg overflow-hidden border border-gray-200 mb-3 relative">
              <video ref={videoRef} className="w-full h-64 bg-black object-cover" muted playsInline />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-white rounded-lg opacity-50"></div>
              </div>
            </div>
            
            {scanError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-sm text-red-600">{scanError}</p>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mb-2">Manual entry:</div>
            <div className="flex gap-2">
              <input 
                value={scannedCode} 
                onChange={(e)=>{ setScannedCode(e.target.value); setScanError(''); }} 
                placeholder="Enter booking code or ID" 
                className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500" 
              />
              <button 
                onClick={()=> verifyAndCheckIn(scannedCode)} 
                disabled={!scannedCode.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                Test
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRCodeTest;
