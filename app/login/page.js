"use client";
import { useState, useEffect, useRef } from "react";
import { auth } from "@/lib/firebase";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
export default function LoginPage() {
  const [loginMethod, setLoginMethod] = useState("otp"); 
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const recaptchaRef = useRef(null);
  useEffect(() => {
    if (!recaptchaRef.current && typeof window !== "undefined") {
      recaptchaRef.current = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
      });
    }
    return () => {
      if (recaptchaRef.current) {
        recaptchaRef.current.clear();
        recaptchaRef.current = null;
      }
    };
  }, []);
  // --- OTP Logic ---
  const sendOtp = async () => {
    if (phoneNumber.length !== 10) return toast.error("plz enter vailid 10 digit number");
    setLoading(true);
    try {
      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        body: JSON.stringify({ phone: phoneNumber }),
      });
      if (!checkRes.ok) {
        const data = await checkRes.json();
        toast.error(data.message); 
        setLoading(false);
        return; 
      }
      const confirmation = await signInWithPhoneNumber(auth, `+91${phoneNumber}`, recaptchaRef.current);
      setConfirmationResult(confirmation);
      setStep(2);
      toast.success("otp has sent on register mobile number")
    } catch (error) {
      toast.error(error.message)
    } finally { setLoading(false); }
  };
  const verifyOtp = async () => {
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      const res = await fetch("/api/auth/login-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber }),
      });
      const data = await res.json();
      if (res.ok) handleRedirect(data.user.role);
      else toast.success(data.message)
    } catch (error) { toast.error('wrong opt'); }
    finally { setLoading(false); }
  };
  // --- Password Logic ---
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier: phoneNumber, password }),
      });
      const data = await res.json();
      if (res.ok) handleRedirect(data.user.role);
      else toast.error(data.message);
    } catch (error) { toast.error("Login failed"); }
    finally { setLoading(false); }
  };
  const handleRedirect = async (role) => {
  toast.success("Login Successful!");
  const normalizedRole = role?.trim().toUpperCase();
  if (normalizedRole === "ADMIN") {
    await router.push("/admin/dashboard");
  } else {
    await router.push("/user/dashboard");
  }
};
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="p-8 bg-white shadow-lg rounded-xl w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold mb-2 text-center text-blue-900">Vitta-Lekha</h2>
        <p className="text-gray-500 text-center mb-8 italic">Finance Management Simplified</p>
        {/* Toggle Switch */}
        {step === 1 && (
          <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button 
              onClick={() => setLoginMethod("otp")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${loginMethod === "otp" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
            >OTP Login</button>
            <button 
              onClick={() => setLoginMethod("password")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition ${loginMethod === "password" ? "bg-white shadow text-blue-600" : "text-gray-500"}`}
            >Password</button>
          </div>
        )}
        <div className="space-y-4">
          {step === 1 ? (
            <>
              <input
                type="text"
                placeholder="Phone Number"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                onChange={(e) => setPhoneNumber(e.target.value)}
              />  
              {loginMethod === "password" && (
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
               <button 
               type="button"
                onClick={loginMethod === "otp" ? sendOtp : handlePasswordLogin}
                disabled={loading}
                className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
              >
                {loading ? "processing..." : (loginMethod === "otp" ? "Get OTP" : "Login Now")}
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-center text-gray-600">OTP sent to <b>+91 {phoneNumber}</b></p>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                className="w-full p-3 border rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-green-500 outline-none"
                maxLength={6}
                onChange={(e) => setOtp(e.target.value)}
              />
              <button 
                onClick={verifyOtp}
                disabled={loading}
                className="w-full bg-green-600 text-white p-3 rounded-lg font-semibold hover:bg-green-700 transition"
              >Verify OTP</button>
              <button onClick={() => setStep(1)} className="w-full text-blue-600 text-sm hover:underline">Change Number</button>
            </div>
          )}
        </div>
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
}