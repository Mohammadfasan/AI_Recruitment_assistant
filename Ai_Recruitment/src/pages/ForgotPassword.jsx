import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../services/authApi';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Key } from 'lucide-react';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await forgotPassword(data.email);
      setLoading(false);
      if (res.success) {
        toast.success('Reset code generated successfully!');
        setResetToken(res.token);
      } else {
        toast.error(res.error || 'Failed to request reset link');
      }
    } catch (err) {
      setLoading(false);
      toast.error(err.response?.data?.error || 'Failed to request reset link');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3 shadow-md">
            R
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Forgot password?</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5">
            Enter your email address and we'll send you a password reset code.
          </p>
        </div>

        {resetToken ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-800 dark:text-emerald-400 text-sm space-y-2">
              <p className="font-semibold">Reset Code Generated (Simulation Mode):</p>
              <div className="flex items-center space-x-2 bg-white dark:bg-zinc-950 p-2 border border-emerald-200 dark:border-emerald-800/60 rounded-lg select-all font-mono text-center justify-center text-zinc-800 dark:text-zinc-200">
                {resetToken}
              </div>
              <p className="text-xs text-emerald-600 dark:text-emerald-500 font-medium">
                Copy this code and click the link below to set your new password.
              </p>
            </div>
            
            <Link
              to={`/reset-password?token=${resetToken}`}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Key className="w-4 h-4" />
              <span>Go to Password Reset</span>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  {...register('email', {
                    required: 'Email address is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  className={`w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-950 border rounded-lg text-sm text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-hidden focus:ring-1 ${
                    errors.email
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-zinc-200 dark:border-zinc-800 focus:ring-indigo-600 focus:border-indigo-600'
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 font-medium">{errors.email.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin mr-2" />
                  <span>Requesting...</span>
                </>
              ) : (
                <span>Request Reset Code</span>
              )}
            </button>
          </form>
        )}

        <div className="text-center mt-6 pt-5 border-t border-zinc-100 dark:border-zinc-800/80">
          <Link to="/login" className="inline-flex items-center space-x-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
