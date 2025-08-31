'use client'

import { useState, useCallback, useRef } from 'react'
import Image from 'next/image'
import JSZip from 'jszip'
import ParameterControls from './ParameterControls'
import KeychainViewer from './KeychainViewer'
import { exportOBJ as generateOBJ } from '@/utils/objExporter'

import { KeychainParameters, defaultParameters, KeychainListItem } from '@/types/keychain'
import { X, ShoppingCart } from 'lucide-react'


export default function KeychainGenerator() {
  const [parameters, setParameters] = useState<KeychainParameters>(defaultParameters)
  const [pendingParameters, setPendingParameters] = useState<KeychainParameters>(defaultParameters)
  const [commitId, setCommitId] = useState(0)
  const [keychainList, setKeychainList] = useState<KeychainListItem[]>([])
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [activeQR, setActiveQR] = useState<'gcash' | 'maya' | null>(null)
  const [selectedFile, setSelectedFile] = useState<{ data: string; type: string } | null>(null)
  const [deliveryOption, setDeliveryOption] = useState('')
  const [showDeliveryFields, setShowDeliveryFields] = useState(false)
  const [showAllKeychains, setShowAllKeychains] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTutModal, setShowTutModal] = useState(false)
  const [tutMethod, setTutMethod] = useState<'gcash' | 'maya' | null>(null)
  const [hasSeenTutorial, setHasSeenTutorial] = useState<{ gcash: boolean; maya: boolean }>({ gcash: false, maya: false })
  const previewRef = useRef<HTMLDivElement>(null)

  const generateKeychainOBJs = async (keychains: KeychainListItem[]) => {
    // Ensure unique folder names when multiple keychains share the same line1
    const nameCounts: Record<string, number> = {}

    const objPromises = keychains.map(async (keychain) => {
      const { obj, mtl } = await generateOBJ(keychain.parameters);
      const base = keychain.parameters.line1.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'keychain'
      nameCounts[base] = (nameCounts[base] || 0) + 1
      const folderName = nameCounts[base] > 1 ? `${base}_${nameCounts[base]}` : base

      return {
        folderName,
        objFile: {
          fileName: 'keychain.obj',
          data: obj
        },
        mtlFile: {
          fileName: 'keychain.mtl',
          data: mtl
        }
      };
    });

    return Promise.all(objPromises);
  }

  const createZipFile = async (files: Array<{ folderName: string, objFile: { fileName: string, data: string }, mtlFile: { fileName: string, data: string } }>) => {
    const zip = new JSZip();
    
    files.forEach(({ folderName, objFile, mtlFile }) => {
      zip.folder(folderName)!.file(objFile.fileName, objFile.data);
      zip.folder(folderName)!.file(mtlFile.fileName, mtlFile.data);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    
    // Convert blob to base64
    return new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.readAsDataURL(zipBlob);
    });
  }

  const calculateTotal = (): { subtotal: number, total: number } => {
    const subtotal = keychainList.length * 30 // ₱30 per piece
    return {
      subtotal,
      total: subtotal
    }
  }

  // Helper function to convert hex colors to readable names
  const getColorName = (hexColor: string) => {
    const colorMap: { [key: string]: string } = {
      '#FFFFFF': 'Cotton White',
      '#D3D3D3': 'Light Grey',
      '#000000': 'Black',
      '#FFB6C1': 'Sakura Pink',
      '#FFC0CB': 'Pink',
      '#FF0000': 'Red',
      '#FFB347': 'Pastel Orange',
      '#FFFF00': 'Yellow',
      '#FFFFE0': 'Pastel Yellow',
      '#98FB98': 'Pale Green',
      '#98FF98': 'Mint Green',
      '#006400': 'Dark Green',
      '#008080': 'Teal',
      '#ADD8E6': 'Light Blue',
      '#000080': 'Navy Blue',
      '#0F52BA': 'Sapphire Blue',
      '#CCCCFF': 'Periwinkle',
      '#E6E6FA': 'Lavender Purple'
    }
    return colorMap[hexColor] || hexColor
  }

  const updateParameter = useCallback((key: keyof KeychainParameters, value: any) => {
    setPendingParameters(prev => ({
      ...prev,
      [key]: value
    }))
  }, [])

  const resetToDefaults = useCallback(() => {
    // Keep current font when resetting
    const currentFont = pendingParameters.font
    const currentFontUrl = pendingParameters.fontUrl
    setPendingParameters({
      ...defaultParameters,
      font: currentFont,
      fontUrl: currentFontUrl
    })
  }, [pendingParameters.font, pendingParameters.fontUrl])

  const handleGenerate = useCallback(() => {
    
    // Scroll to preview section on mobile
    if (window.innerWidth < 1024 && previewRef.current) {
      previewRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      })
    }
    
    // Simulate sync handoff; in real flow, heavy work kicks in within viewer
    requestAnimationFrame(() => {
      setParameters(pendingParameters)
      setCommitId((c) => c + 1)
    })
  }, [pendingParameters])

  const handleAddToList = useCallback(async () => {
    const newKeychain: KeychainListItem = {
      id: Date.now().toString(),
      parameters: { ...parameters },
      addedAt: new Date().toISOString()
    }
    setKeychainList(prev => [...prev, newKeychain])
  }, [parameters])

  const handleRemoveKeychain = useCallback((id: string) => {
    setKeychainList(prev => prev.filter(k => k.id !== id))
  }, [])

  const handlePurchase = useCallback(() => {
    setShowPurchaseForm(true)
  }, [])

  const handlePurchaseSubmit = useCallback(async (formData: any) => {
    console.log('Submitting with:', { activeQR, selectedFile, formData });
    if (!activeQR) {
      alert('Please select a payment method (GCash or Maya)')
      return
    }

    if (!selectedFile) {
      alert('Please upload your payment receipt first')
      return
    }

    setIsSubmitting(true)

    try {
      // Generate OBJ files and create ZIP
      const objFiles = await generateKeychainOBJs(keychainList);
      const zipBase64 = await createZipFile(objFiles);

      // Create the full payload with all necessary data
      const payload = {
        customerInfo: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
          socialMedia: formData.socialMedia || null,
          deliveryOption: formData.deliveryOption,
          address: formData.deliveryOption === 'delivery' ? formData.address : null,
          landmark: formData.deliveryOption === 'delivery' ? formData.landmark : null
        },
        order: {
          items: keychainList.map(item => ({
            text: {
              line1: item.parameters.line1,
              line2: item.parameters.line2,
              baseColor: getColorName(item.parameters.baseColor),
              textColor: getColorName(item.parameters.textColor),
              font: item.parameters.font
            }
          })),
          totalAmount: calculateTotal().total,
          objFiles: {
            mimeType: "application/zip",
            data: zipBase64
          }
        },
        payment: {
          receipt: {
            mimeType: selectedFile.type,
            data: selectedFile.data
          },
          method: activeQR || null
        }
      }

      // Send the order to the webhook
      const response = await fetch('https://workflows.eunoiadigitalph.com/webhook/keygo-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to submit order');
      }

      alert('Order submitted successfully! We will contact you soon.');
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Failed to submit order. Please try again or contact support.');
      return;
    } finally {
      setIsSubmitting(false);
    }
    setShowPurchaseForm(false)
    setKeychainList([])
    setSelectedFile(null)
    setDeliveryOption('')
    setShowDeliveryFields(false)
    setActiveQR(null)
  }, [selectedFile, activeQR])

  return (
    <div className="flex flex-col lg:flex-row gap-5 min-h-fit">
      {/* Parameter Controls - Above preview on mobile, sidebar on desktop */}
      <div className="lg:w-80 lg:bg-white lg:rounded-lg lg:p-3 lg:shadow-sm lg:border lg:border-gray-200">
        <div className="lg:h-full lg:flex lg:flex-col">
          <div className="lg:flex-1">
            <ParameterControls
              parameters={pendingParameters}
              onParameterChange={updateParameter}
              onReset={resetToDefaults}
              onGenerate={handleGenerate}
              onAddToList={handleAddToList}
              keychainList={keychainList}
              onRemoveKeychain={handleRemoveKeychain}
              onPurchase={handlePurchase}
            />
          </div>
        </div>
      </div>

      {/* 3D Viewer */}
      <div className="flex-1 relative" ref={previewRef}>
        <div className="sticky top-20 w-full">
            <KeychainViewer parameters={parameters} commitId={commitId} />
        </div>
      </div>

              {/* Purchase Form Modal */}
        {showPurchaseForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-h-[90vh] overflow-y-auto max-w-[90vw]">
              <div className="p-6">
                {/* Tutorial Modal */}
                {showTutModal && tutMethod && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowTutModal(false)}>
                    <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-lg" onClick={(e) => e.stopPropagation()}>
                      <div className="p-4 border-b flex flex-col justify-between">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {tutMethod === 'gcash' ? 'GCash Reference Guide' : 'Maya Reference Guide'}
                        </h3>
                        <button
                          className={`text-white ${tutMethod === 'gcash' ? 'bg-[#1E3C96]' : 'bg-[#008242]'} rounded-lg hover:bg-colors.primary.600 w-fit p-2 border border-gray-200 mt-2`}
                          onClick={() => {
                            setHasSeenTutorial(prev => ({ ...prev, [tutMethod]: true }))
                            setShowTutModal(false)
                          }}
                        >
                          I Understand
                        </button>
                      </div>
                      <div className="p-4 space-y-3">
                        {tutMethod === 'gcash' ? (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600">Find the Reference Number in your GCash receipt like this:</p>
                            <div className="mx-auto w-[292px] h-[633px] max-w-[85vw] max-h-[80vh]">
                              <img src="/gcashtut.PNG" alt="GCash Tutorial" className="w-full h-full object-contain rounded-md border" />
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-600">Follow these steps to locate the Maya Reference ID:</p>
                            <div className="mx-auto w-[292px] h-[633px] max-w-[85vw] max-h-[80vh]">
                              <img src="/mayatut1.PNG" alt="Maya Tutorial 1" className="w-full h-full object-contain rounded-md border" />
                            </div>
                            <div className="mx-auto w-[292px] h-[633px] max-w-[85vw] max-h-[80vh]">
                              <img src="/mayatut2.PNG" alt="Maya Tutorial 2" className="w-full h-full object-contain rounded-md border" />
                            </div>
                            <div className="mx-auto w-[292px] h-[633px] max-w-[85vw] max-h-[80vh]">
                              <img src="/mayatut3.PNG" alt="Maya Tutorial 3" className="w-full h-full object-contain rounded-md border" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Purchase Keychains</h2>
                  <button
                    onClick={() => setShowPurchaseForm(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

              <div className="flex flex-col lg:flex-row lg:gap-8">
                {/* Customer Form */}
                              <form 
                id="purchase-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const data = Object.fromEntries(formData);
                  console.log('Form data:', data);
                  handlePurchaseSubmit(data);
                }} 
                className="space-y-4 lg:flex-1">
                <div>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Name"
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    pattern="[0-9]{11}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Phone Number"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Email"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    name="socialMedia"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Social Media (Optional)"
                  />
                </div>
                <div>
                    <select 
                      name="deliveryOption"
                      required
                      value={deliveryOption}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                              onChange={(e) => {
                          const value = e.target.value;
                          setDeliveryOption(value);
                          setShowDeliveryFields(value === 'delivery');
                        }}
                    >
                      <option value="" disabled>Select Delivery Option</option>
                      <option value="delivery">Delivery</option>
                      <option value="pickup">Pickup</option>
                    </select>

                    {/* Delivery Fields */}
                        {showDeliveryFields && (
                        <div className="mt-2 flex md:flex-row flex-col gap-2">
                            <input
                              type="text"
                              name="address"
                              required
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Complete Address"
                            />
                            <input
                              type="text"
                              name="landmark"
                              required
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Notable Landmark"
                            />
                        </div>
                    )}
                </div>

                {/* Payment Options */}
                <div className="space-y-4">
                  <div className="flex gap-6">
                    {/* Payment Buttons */}
                    <div className="flex flex-col gap-4 w-1/3">
                      {/* GCash */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = activeQR === 'gcash' ? null : 'gcash'
                          setActiveQR(next)
                          if (next && !hasSeenTutorial.gcash) {
                            setTutMethod('gcash')
                            setShowTutModal(true)
                          }
                        }}
                        className={`w-full h-16 rounded-lg border transition-all relative overflow-hidden ${
                          activeQR === 'gcash' 
                            ? 'bg-[#0071BB] border-blue-500 ring-2 ring-blue-500' 
                            : 'bg-[#0071BB] border-gray-200 hover:border-blue-500'
                        }`}
                      >
                        <Image
                          src="/gcashlg.png"
                          alt="GCash Logo"
                          fill
                          className="object-contain p-2"
                        />
                      </button>

                      {/* Maya */}
                      <button
                        type="button"
                        onClick={() => {
                          const next = activeQR === 'maya' ? null : 'maya'
                          setActiveQR(next)
                          if (next && !hasSeenTutorial.maya) {
                            setTutMethod('maya')
                            setShowTutModal(true)
                          }
                        }}
                        className={`w-full h-16 rounded-lg border transition-all relative overflow-hidden ${
                          activeQR === 'maya' 
                            ? 'bg-black border-blue-500 ring-2 ring-blue-500' 
                            : 'bg-black border-gray-200 hover:border-blue-500'
                        }`}
                      >
                        <Image
                          src="/mayalg.jpg"
                          alt="Maya Logo"
                          fill
                          className="object-contain p-2"
                        />
                      </button>
                    </div>

                    {/* QR Code Display */}
                    <div className="flex-1 relative">
                      <div className="aspect-square max-h-[145px] bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-center">
                        {activeQR ? (
                          <div className="relative w-full h-full animate-fade-in">
                            <Image
                              src={activeQR === 'gcash' ? '/Gcash.png' : '/Maya.png'}
                              alt={`${activeQR === 'gcash' ? 'GCash' : 'Maya'} QR Code`}
                              fill
                              className="object-contain p-4"
                            />
                          </div>
                        ) : (
                          <p className="text-gray-400 text-center text-sm">Select a payment method</p>
                        )}
                      </div>
                      <span className="text-black text-center text-sm font-bold">{`${activeQR === 'gcash' ? "Eu**** Se****" : activeQR === 'maya' ? "Pa*** Sa****" : ""}`}</span>
                    </div>
                  </div>
                </div>
              </form>

              {/* Right Side Content - Desktop */}
              <div className="mt-6 lg:mt-0 lg:w-96 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Selected Keychains</h3>
                  <div className="space-y-3">
                    {(showAllKeychains ? keychainList : keychainList.slice(0, 1)).map((item) => (
                      <div key={item.id} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          {/* Gradient Preview */}
                          <div 
                            className="self-center w-[110px] h-[110px] rounded-lg shadow-sm flex-shrink-0"
                            style={{ 
                              background: `linear-gradient(135deg, ${item.parameters.baseColor} 0%, ${item.parameters.textColor} 100%)`
                            }}
                          />
                          
                          {/* Keychain Details */}
                          <div className="flex-1">
                        <div className="text-sm font-medium text-black">
                          {item.parameters.line1 || 'No text'}
                        </div>
                        {item.parameters.line2 && (
                          <div className="text-sm text-black">
                            {item.parameters.line2}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1">
                              Font: {item.parameters.font} <br /> Base: {getColorName(item.parameters.baseColor)} <br /> Text: {getColorName(item.parameters.textColor)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {keychainList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setShowAllKeychains(!showAllKeychains)}
                        className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {showAllKeychains ? 'Show Less' : `Show ${keychainList.length - 1} More`}
                      </button>
                    )}
                </div>

                {/* Order Summary */}
                {keychainList.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-base font-bold">
                        <span>Total ({keychainList.length} {keychainList.length === 1 ? 'piece' : 'pieces'} × ₱30)</span>
                        <span>₱{calculateTotal().total}</span>
                  </div>
                      {showDeliveryFields && (
                        <p className="text-sm text-yellow-600 text-center font-bold">Delivery fee will be calculated upon delivery</p>
                      )}
                  </div>
                  </div>
                )}

                {/* Receipt Upload */}
                <div className="relative mt-2">
                    <input
                      type="file"
                    name="receipt"
                    required
                      accept="image/*"
                    className="sr-only"
                    id="receipt-upload"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // Check file size (3MB limit)
                          const MAX_SIZE = 3 * 1024 * 1024; // 3MB in bytes
                          if (file.size > MAX_SIZE) {
                            alert('File is too large. Please upload an image under 3MB.');
                            e.target.value = ''; // Reset input
                            return;
                          }

                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const base64Data = e.target?.result as string;
                            // Extract the base64 data without the data URL prefix
                            const [, mime, data] = base64Data.match(/^data:(.*);base64,(.*)$/) || [];
                            setSelectedFile({
                              type: mime,
                              data: data
                            });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                  />
                  {selectedFile ? (
                    <div className="relative group">
                      <img 
                        src={`data:${selectedFile.type};base64,${selectedFile.data}`}
                        alt="Receipt preview" 
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <label
                        htmlFor="receipt-upload"
                        className="absolute inset-0 bg-black bg-opacity-50 rounded-lg hidden group-hover:flex items-center justify-center cursor-pointer"
                      >
                        <span className="text-white text-sm">Change Receipt</span>
                      </label>
                    </div>
                  ) : (
                    <label
                      htmlFor="receipt-upload"
                      className={`flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg transition-colors cursor-pointer group ${
                        !activeQR || (activeQR === 'gcash' ? !hasSeenTutorial.gcash : !hasSeenTutorial.maya)
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-blue-500'
                      }`}
                      onClick={(e) => {
                        const needsTut = !activeQR || (activeQR === 'gcash' ? !hasSeenTutorial.gcash : !hasSeenTutorial.maya)
                        if (needsTut) {
                          e.preventDefault()
                          if (activeQR) {
                            setTutMethod(activeQR)
                            setShowTutModal(true)
                          }
                        }
                      }}
                    >
                      <div className="flex flex-col items-center gap-2 text-gray-500 group-hover:text-blue-500">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm">
                          {(!activeQR || (activeQR === 'gcash' ? !hasSeenTutorial.gcash : !hasSeenTutorial.maya))
                            ? 'Select payment method first'
                            : 'Upload Receipt Screenshot'}
                        </span>
                        <span className="text-xs text-gray-400">Click to browse</span>
                      </div>
                    </label>
                  )}
                  </div>

                {/* Submit Button */}
                                  <button
                  type="submit"
                  form="purchase-form"
                  disabled={isSubmitting}
                  className={`mt-2 w-full bg-[#FFB81C] text-white py-3 px-4 rounded-lg transition-colors font-medium ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#FFB81C]'
                  }`}
                >
                  {isSubmitting ? 'Processing Order...' : 'Submit Order'}
                </button>
                </div>
              </div>
            </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
