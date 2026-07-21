import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';
import { updateUserProfile } from '../services/authApi';
import toast from 'react-hot-toast';
import { Building, Mail, Phone, MapPin, Globe, Award, FileText } from 'lucide-react';

const CompanyProfile = () => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      company: {
        name: '',
        logo: '',
        industry: '',
        website: '',
        email: '',
        phone: '',
        address: '',
        description: ''
      }
    }
  });

  useEffect(() => {
    if (user && user.company) {
      reset({
        company: {
          name: user.company.name || '',
          logo: user.company.logo || '',
          industry: user.company.industry || '',
          website: user.company.website || '',
          email: user.company.email || '',
          phone: user.company.phone || '',
          address: user.company.address || '',
          description: user.company.description || ''
        }
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await updateUserProfile(data);
      if (res.success) {
        toast.success('Company profile updated successfully!');
        setUser(res.data);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to update company profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex items-center space-x-4">
        <div className="w-14 h-14 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm shrink-0">
          {user?.company?.name?.[0] || 'C'}
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-zinc-50">
            {user?.company?.name || 'Register Company'}
          </h1>
          <p className="text-xs text-zinc-500 font-semibold mt-0.5">
            Configure company branding, descriptions, and contact settings.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider flex items-center space-x-1.5">
            <Building className="w-4 h-4" />
            <span>Company Information</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Company Name *</label>
              <input
                type="text"
                placeholder="Acme Corp"
                {...register('company.name', { required: 'Company name is required' })}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
              {errors.company?.name && <p className="text-xs text-red-500 font-medium">{errors.company.name.message}</p>}
            </div>

            {/* Industry */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Industry</label>
              <input
                type="text"
                placeholder="Technology, Financial Services"
                {...register('company.industry')}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Website */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Website</label>
              <div className="relative">
                <Globe className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="acme.com"
                  {...register('company.website')}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Contact Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="contact@acme.com"
                  {...register('company.email')}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Contact Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="+1 555-0100"
                  {...register('company.phone')}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logo URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Logo Image URL</label>
              <input
                type="text"
                placeholder="https://example.com/logo.png"
                {...register('company.logo')}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
              />
            </div>

            {/* Address */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Office Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="One Infinite Loop, Cupertino, CA"
                  {...register('company.address')}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Company Description</label>
            <textarea
              rows="5"
              placeholder="Describe Acms Corp's mission, values, size, and services..."
              {...register('company.description')}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md cursor-pointer flex items-center space-x-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-indigo-200 border-t-white rounded-full animate-spin mr-2" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Company Profile</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyProfile;
