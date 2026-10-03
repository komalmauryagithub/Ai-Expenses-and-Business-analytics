import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters long.';
    }
    if (password !== passwordConfirmation) {
      errors.password_confirmation = 'Password confirmation does not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await register(name, email, password, passwordConfirmation);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response && err.response.data) {
        setApiError(err.response.data.message || 'Registration failed');
        if (err.response.data.errors) {
          setFieldErrors(err.response.data.errors);
        }
      } else {
        setApiError('Unable to connect to backend server.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Create your account</h2>
        <p className="mt-2 text-sm text-slate-400">
          Start your financial intelligence journey today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-slate-900/90 backdrop-blur-md py-8 px-6 shadow-2xl shadow-black/50 sm:rounded-2xl border border-slate-800">
          
          {apiError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start space-x-3 text-rose-300 text-sm">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div>{apiError}</div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Komal Sharma"
                  className={`block w-full pl-11 pr-4 py-3 bg-slate-800/80 border ${
                    fieldErrors.name ? 'border-rose-500 text-rose-200' : 'border-slate-700 text-slate-100'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm placeholder-slate-500 transition duration-150`}
                />
              </div>
              {fieldErrors.name && (
                <p className="mt-1.5 text-xs text-rose-400 font-medium">
                  {Array.isArray(fieldErrors.name) ? fieldErrors.name[0] : fieldErrors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={`block w-full pl-11 pr-4 py-3 bg-slate-800/80 border ${
                    fieldErrors.email ? 'border-rose-500 text-rose-200' : 'border-slate-700 text-slate-100'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm placeholder-slate-500 transition duration-150`}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1.5 text-xs text-rose-400 font-medium">
                  {Array.isArray(fieldErrors.email) ? fieldErrors.email[0] : fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className={`block w-full pl-11 pr-11 py-3 bg-slate-800/80 border ${
                    fieldErrors.password ? 'border-rose-500 text-rose-200' : 'border-slate-700 text-slate-100'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm placeholder-slate-500 transition duration-150`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1.5 text-xs text-rose-400 font-medium">
                  {Array.isArray(fieldErrors.password) ? fieldErrors.password[0] : fieldErrors.password}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="passwordConfirmation" className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Confirm Password
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="passwordConfirmation"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  placeholder="Repeat your password"
                  className={`block w-full pl-11 pr-4 py-3 bg-slate-800/80 border ${
                    fieldErrors.password_confirmation ? 'border-rose-500 text-rose-200' : 'border-slate-700 text-slate-100'
                  } rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-sm placeholder-slate-500 transition duration-150`}
                />
              </div>
              {fieldErrors.password_confirmation && (
                <p className="mt-1.5 text-xs text-rose-400 font-medium">
                  {Array.isArray(fieldErrors.password_confirmation) ? fieldErrors.password_confirmation[0] : fieldErrors.password_confirmation}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-sky-500/25 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-sky-500 transition duration-150 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-sky-400 hover:text-sky-300 transition">
              Sign in
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
