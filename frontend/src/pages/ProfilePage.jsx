import { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { Camera, Mail, User, Phone, Info, Edit2, Check, X } from "lucide-react";

const ProfilePage = () => {
  const { authUser, isUpdatingProfile, updateProfile, requestContactUpdate, verifyContactUpdate } = useAuthStore();

  const [selectedImage, setSelectedImage] = useState(null);

  // Edit states for user details
  const [editMode, setEditMode] = useState({ fullName: false, bio: false, email: false, phone: false });
  const [formData, setFormData] = useState({
    fullName: authUser?.fullName || "",
    bio: authUser?.bio || "",
    email: authUser?.email || "",
    phone: authUser?.phone || "",
  });

  const [otpModal, setOtpModal] = useState({ isOpen: false, type: "", otp: "", oldEmailOtp: "" });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = async () => {
      const base64Image = reader.result;
      setSelectedImage(base64Image);
      await updateProfile({ profilePic: base64Image });
    };
  };

  const handleSaveProfileInfo = async (field) => {
    if (formData[field] === authUser[field]) {
      setEditMode({ ...editMode, [field]: false });
      return;
    }

    await updateProfile({ [field]: formData[field] });
    setEditMode({ ...editMode, [field]: false });
  };

  const handleRequestContactUpdate = async (type) => {
    if (formData[type] === authUser[type]) {
      setEditMode({ ...editMode, [type]: false });
      return;
    }

    const payload = type === "email" ? { newEmail: formData.email } : { newPhone: formData.phone };
    const success = await requestContactUpdate(payload);

    if (success) {
      setOtpModal({ isOpen: true, type, otp: "", oldEmailOtp: "" });
    }
  };

  const handleVerifyOTP = async () => {
    const payload = {
      otp: otpModal.otp,
      ...(otpModal.type === "email" ? { newEmail: formData.email, oldEmailOtp: otpModal.oldEmailOtp } : { newPhone: formData.phone })
    };

    const success = await verifyContactUpdate(payload);
    if (success) {
      setOtpModal({ isOpen: false, type: "", otp: "", oldEmailOtp: "" });
      setEditMode({ ...editMode, [otpModal.type]: false });
    }
  };

  const cancelEdit = (field) => {
    setFormData({ ...formData, [field]: authUser[field] || "" });
    setEditMode({ ...editMode, [field]: false });
  };

  const renderField = (field, label, Icon, type = "text") => (
    <div className="space-y-2">
      <div className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="size-4" />
          {label}
        </div>
        {!editMode[field] && (
          <button onClick={() => setEditMode({ ...editMode, [field]: true })} className="text-[#6764f2] hover:text-[#524fcc] text-xs font-semibold flex items-center gap-1">
            <Edit2 className="size-3" /> Edit
          </button>
        )}
      </div>

      {editMode[field] ? (
        <div className="flex items-center gap-2">
          <input
            type={type}
            value={formData[field]}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            className="flex-1 px-4 py-3 bg-white dark:bg-[#16152a] text-slate-900 dark:text-slate-100 rounded-xl border border-[#6764f2] outline-none shadow-sm transition-all focus:ring-2 focus:ring-[#6764f2]/50"
            autoFocus
          />
          <button
            onClick={() => (field === "email" || field === "phone") ? handleRequestContactUpdate(field) : handleSaveProfileInfo(field)}
            className="p-3 bg-[#6764f2] text-white rounded-xl shadow-md hover:bg-[#524fcc]"
            title="Save"
          >
            <Check className="size-5" />
          </button>
          <button
            onClick={() => cancelEdit(field)}
            className="p-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600"
            title="Cancel"
          >
            <X className="size-5" />
          </button>
        </div>
      ) : (
        <p className="px-4 py-3 bg-slate-50 dark:bg-[#1e1d33] text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[46px]">
          {authUser?.[field] || <span className="text-slate-400 italic">Not provided</span>}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#111022] pt-20 pb-10">
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="bg-white dark:bg-[#16152a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm">

          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Profile</h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm">Manage your profile information</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <img
                src={selectedImage || authUser?.profilePic || "/avatar.png"}
                alt="Profile"
                className="size-32 rounded-full object-cover ring-4 ring-slate-100 dark:ring-[#1e1d33] shadow-md"
              />
              <label
                htmlFor="avatar-upload"
                className={`
                  absolute bottom-0 right-0 
                  bg-[#6764f2] text-white hover:bg-[#524fcc]
                  p-2.5 rounded-full cursor-pointer shadow-lg shadow-[#6764f2]/30
                  transition-all duration-200 group-hover:scale-105
                  ${isUpdatingProfile ? "animate-pulse pointer-events-none" : ""}
                `}
              >
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  id="avatar-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUpdatingProfile}
                />
              </label>
            </div>
          </div>

          <div className="space-y-6">
            {renderField("fullName", "Full Name", User)}
            {renderField("bio", "Bio", Info)}
            {renderField("email", "Email Address", Mail, "email")}
            {renderField("phone", "Phone Number", Phone, "tel")}
          </div>

        </div>
      </div>

      {/* OTP Modal */}
      {otpModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#16152a] rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Verify Contact Update</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {otpModal.type === "email"
                ? "Please enter the OTP sent to both your old and new email."
                : "Please enter the OTP sent to your new phone."}
            </p>

            {otpModal.type === "email" && (
              <input
                type="text"
                value={otpModal.oldEmailOtp}
                onChange={(e) => setOtpModal({ ...otpModal, oldEmailOtp: e.target.value })}
                placeholder="OTP sent to old email"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1e1d33] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-[#6764f2] mb-4"
              />
            )}

            <input
              type="text"
              value={otpModal.otp}
              onChange={(e) => setOtpModal({ ...otpModal, otp: e.target.value })}
              placeholder={otpModal.type === "email" ? "OTP sent to new email" : "Enter OTP"}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-[#1e1d33] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-[#6764f2] mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setOtpModal({ isOpen: false, type: "", otp: "", oldEmailOtp: "" })}
                className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyOTP}
                disabled={!otpModal.otp || (otpModal.type === "email" && !otpModal.oldEmailOtp)}
                className="flex-1 py-3 bg-[#6764f2] text-white font-semibold rounded-xl hover:bg-[#524fcc] disabled:opacity-50 transition-colors"
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
