import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/Header";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Check if credentials match demo credentials
    if (username === "admin" && password === "5CS7FsnJrCRY") {
      // Store authentication flag in localStorage
      localStorage.setItem("adminAuthenticated", "true");
      navigate("/dashboard");
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Header />

      <main className="flex-1 flex items-start justify-center px-6 pt-28 pb-8">
        <div className="w-full max-w-[448px]">
          <div className="flex flex-col gap-6 p-0 rounded-[14px] border border-black/10 bg-white">
            {/* Card Header */}
            <div className="flex flex-col items-center pt-6 px-6 pb-0">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#D0FAE5] mb-[22px]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z"
                    stroke="#009966"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11"
                    stroke="#009966"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1 className="text-[#0A0A0A] text-base leading-4 font-normal mb-[10px]">
                Admin Login
              </h1>

              <p className="text-[#717182] text-base leading-6 font-normal text-center mb-0">
                Enter your credentials to access the inventory dashboard
              </p>
            </div>

            {/* Card Content */}
            <div className="px-6 pb-6 flex flex-col gap-4">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-[#FEE2E2] border border-[#FCA5A5]">
                    <p className="text-[#991B1B] text-sm leading-5 font-normal">
                      {error}
                    </p>
                  </div>
                )}

                {/* Username */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border border-transparent text-sm placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#009966]/20"
                  />
                </div>

                {/* Password */}
                <div className="flex flex-col gap-2">
                  <label className="text-[#0A0A0A] text-sm leading-[14px] font-normal">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-9 px-3 py-1 rounded-lg bg-[#F3F3F5] border border-transparent text-sm placeholder:text-[#717182] focus:outline-none focus:ring-2 focus:ring-[#009966]/20"
                  />
                </div>

                {/* Login Button */}
                <button
                  type="submit"
                  className="h-9 px-4 py-2 flex items-center justify-center rounded-lg bg-[#009966] text-white text-sm leading-5 font-normal hover:bg-[#007a52] transition-colors focus:outline-none focus:ring-2 focus:ring-[#009966]/20 focus:ring-offset-2"
                >
                  Log in
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
