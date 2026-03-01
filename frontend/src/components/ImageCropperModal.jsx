import React, { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { X, Check, ZoomIn, ZoomOut } from "lucide-react";
import { getCroppedImg } from "../utils/cropImage";
import imageCompression from "browser-image-compression";

const ImageCropperModal = ({ imageSrc, onCropComplete, onCancel, aspectRatio = 1 }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [dynamicAspect, setDynamicAspect] = useState(1);

    const onCropCompleteEvent = useCallback((croppedArea, croppedAreaPixels) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const onMediaLoaded = useCallback((mediaSize) => {
        if (aspectRatio === "free") {
            setDynamicAspect(mediaSize.width / mediaSize.height);
        }
    }, [aspectRatio]);

    const handleApply = async () => {
        try {
            setIsProcessing(true);
            const { file: croppedImageBlob } = await getCroppedImg(imageSrc, croppedAreaPixels);

            // Compress image
            const options = {
                maxSizeMB: 1, // Max size 1MB
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(croppedImageBlob, options);

            // Convert to base64
            const reader = new FileReader();
            reader.readAsDataURL(compressedFile);
            reader.onloadend = () => {
                onCropComplete(compressedFile, reader.result);
            };
        } catch (e) {
            console.error(e);
            onCancel();
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#16152a] rounded-2xl p-6 w-full max-w-lg border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-[80vh] max-h-[600px]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Adjust Image</h2>
                    <button onClick={onCancel} className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative flex-1 bg-black rounded-xl overflow-hidden mb-4">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio === "free" ? dynamicAspect : aspectRatio}
                        onCropChange={setCrop}
                        onCropComplete={onCropCompleteEvent}
                        onZoomChange={setZoom}
                        onMediaLoaded={onMediaLoaded}
                    />
                </div>

                <div className="flex items-center gap-4 mb-6 px-2">
                    <ZoomOut className="w-5 h-5 text-slate-500" />
                    <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.1}
                        aria-labelledby="Zoom"
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="flex-1 w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700 accent-[#6764f2]"
                    />
                    <ZoomIn className="w-5 h-5 text-slate-500" />
                </div>

                <div className="flex gap-3 mt-auto">
                    <button
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={isProcessing}
                        className="flex-1 py-3 bg-[#6764f2] text-white font-semibold rounded-xl hover:bg-[#524fcc] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                        {isProcessing ? "Processing..." : <><Check className="w-5 h-5" /> Apply</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImageCropperModal;
