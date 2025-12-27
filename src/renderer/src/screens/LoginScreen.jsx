import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { User, Lock, ArrowRight } from "lucide-react";

const LoginScreen = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!window.api) {
        toast.error("Error: API not connected");
        setLoading(false);
        return;
      }

      const result = await window.api.loginUser({ username, password });

      if (result.success) {
        toast.success(`Welcome back, ${result.name}!`);
        // Save user to local storage if needed or global state
        localStorage.setItem(
          "user",
          JSON.stringify({ name: result.name, role: result.role })
        );

        // Navigate to POS
        setTimeout(() => {
          navigate("/pos");
        }, 1000);
      } else {
        toast.error(result.message || "Login failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
      <Toaster position="top-right" />

      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 transition-colors">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Novy POS
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Sign in to access the terminal
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Username Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="text-slate-400 dark:text-slate-500 h-5 w-5" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="admin"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-600 dark:text-slate-300 ml-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="text-slate-400 dark:text-slate-500 h-5 w-5" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition duration-200 flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-pulse">Verifying...</span>
            ) : (
              <>
                Access System <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          <p>Protected System • Authorized Personnel Only</p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
