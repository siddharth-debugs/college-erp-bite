import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

import { Users, BookOpen, Wallet, UserCog, Clock, Shield, Phone } from 'lucide-react';
import { Postdata } from '../../API/GlobalApi';
import Notifier from '../../Utils/notifier';
import { useNavigate } from 'react-router-dom';
import Session from '../../Utils/session';




function Login() {
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [otpSent, setOtpSent] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const phoneInputRef = useRef<HTMLInputElement | null>(null);

    // Auto-focus phone input on mount
    useEffect(() => {
        if (phoneInputRef.current) {
            phoneInputRef.current.focus();
        }
    }, []);

    const navigate = useNavigate();

    const sendOtp = async () => {
        // Validate phone number
        if (phone.length !== 10) {
            Notifier.error('Please enter a valid 10-digit phone number');
            return false;
        }

        try {
            setIsLoading(true);

            const payload = { mobile: phone };
            const res = await Postdata('core/send-login-otp/', payload);

            console.log('response:', res);

            if (res?.message?.toLowerCase().includes('success')) {
                setOtpSent(true);
                Notifier.success(res.message || 'OTP sent successfully');

                setTimeout(() => {
                    otpRefs.current[0]?.focus();
                }, 100);

                return true;
            } else {
                Notifier.error(res?.message || 'Failed to send OTP');
                return false;
            }

        } catch (error: any) {
            console.error('Error sending OTP:', error);
            Notifier.error(
                error?.response?.data?.message ||
                error?.message ||
                'Failed to send OTP'
            );
            return false;
        } finally {
            setIsLoading(false);
        }
    };


    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        await sendOtp();
    };


    const handleResendOTP = async () => {
        setOtp(['', '', '', '', '', '']);

        const success = await sendOtp();

        if (success) {
            Notifier.success('OTP resent successfully!');
        }
    };



    const handleOtpChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all 6 digits are entered
        if (index === 5 && value) {
            const fullOtp = [...newOtp.slice(0, 5), value].join('');
            handleVerifyOTP(fullOtp);
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);

        if (!/^\d+$/.test(pastedData)) return;

        const newOtp = [...otp];
        pastedData.split('').forEach((digit, index) => {
            if (index < 6) {
                newOtp[index] = digit;
            }
        });
        setOtp(newOtp);

        // Focus the next empty box or the last box
        const nextEmptyIndex = newOtp.findIndex(val => !val);
        if (nextEmptyIndex !== -1) {
            otpRefs.current[nextEmptyIndex]?.focus();
        } else {
            otpRefs.current[5]?.focus();
            // Auto-submit if all 6 digits are filled
            handleVerifyOTP(newOtp.join(''));
        }
    };

    const handleVerifyOTP = async (otpValue?: string) => {
        const finalOtp = otpValue ?? otp.join('');

        // ✅ Validation
        if (finalOtp.length !== 6) {
            Notifier.error('Please enter a valid 6-digit OTP');
            return;
        }

        try {
            setIsLoading(true);

            const url = 'core/login/';
            const payload = {
                mobile: phone,
                otp: finalOtp,
            };

            const res = await Postdata(url, payload);
            console.log('verify otp response:', res);

            if (res?.message?.toLowerCase().includes('success')) {
                Notifier.success(res.message || 'Login successful');
                navigate('/students');

                localStorage.setItem('token', res.token);
                Session.set('userName', res?.full_name)
                Session.set('email', res?.email)
                // localStorage.setItem('user', JSON.stringify(res.data.user));



            } else {
                throw new Error(res?.message || 'Invalid OTP');
            }

        } catch (error: any) {
            console.error('OTP verification failed:', error);

            Notifier.error(
                error?.response?.data?.message ||
                error?.message ||
                'Invalid OTP. Please try again.'
            );

            setOtp(['', '', '', '', '', '']);
            otpRefs.current[0]?.focus();

        } finally {
            setIsLoading(false);
        }
    };



    const [_activeFeatureIndex, setActiveFeatureIndex] = useState(0);

    const features = [
        {
            icon: Users,
            title: "Student Management",
            description: "Admissions, registrations, profiles & records",
            color: "from-blue-400 to-blue-600"
        },
        {
            icon: BookOpen,
            title: "Academic Management",
            description: "Courses, exams, results & certificates",
            color: "from-green-400 to-green-600"
        },
        {
            icon: Wallet,
            title: "Finance & Accounts",
            description: "Fee collection, receipts & financial reports",
            color: "from-yellow-400 to-orange-500"
        },
        {
            icon: UserCog,
            title: "HR & Payroll",
            description: "Staff attendance, leave & salary management",
            color: "from-purple-400 to-pink-500"
        }
    ];

    useEffect(() => {
        if (!otpSent) {
            const interval = setInterval(() => {
                setActiveFeatureIndex((prev) => (prev + 1) % features.length);
            }, 3000);
            return () => clearInterval(interval);
        }
        return undefined; // ensures all code paths return
    }, [otpSent, features.length]);

    return (
        <div className="flex h-screen w-full overflow-hidden">
            {/* Left Side - Animated Features Showcase */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#7f56da] via-[#6d49c5] to-[#5a38b0]">
                {/* Animated Background Patterns - Floating Circles */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        className="absolute w-96 h-96 rounded-full bg-white/5"
                        style={{ top: '-10%', right: '-10%' }}
                        animate={{
                            y: [0, 30, 0],
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute w-64 h-64 rounded-full bg-white/5"
                        style={{ bottom: '10%', left: '-5%' }}
                        animate={{
                            y: [0, -20, 0],
                            scale: [1, 1.15, 1],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                    <motion.div
                        className="absolute w-48 h-48 rounded-full bg-white/5"
                        style={{ top: '40%', left: '20%' }}
                        animate={{
                            y: [0, 20, 0],
                            x: [0, 15, 0],
                            scale: [1, 1.08, 1],
                        }}
                        transition={{
                            duration: 7,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </div>

                {/* Content Container */}
                <div className="relative z-10 flex flex-col justify-between p-12 w-full text-white">
                    {/* Logo & Brand */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <motion.span
                            className="text-6xl font-bold block mb-3"
                            style={{ letterSpacing: '0.1em' }}
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <span className="text-white">IM</span>
                            <span className="text-blue-200">ROS</span>
                        </motion.span>
                        <h1 className="text-2xl font-bold mb-2">Campus Management System</h1>
                        <p className="text-blue-100 text-sm">Complete solution for educational institutions</p>
                    </motion.div>

                    {/* All 4 Features Cards - 2x2 Grid */}
                    <div className="grid grid-cols-2 gap-4 my-8">
                        {/* Student Management */}
                        <motion.div
                            className="backdrop-blur-sm bg-white/10 p-5 rounded-2xl border border-white/20 hover:bg-white/15 transition-all cursor-pointer group"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex flex-col items-center text-center gap-3">
                                <motion.div
                                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Users className="w-7 h-7 text-white" />
                                </motion.div>
                                <div>
                                    <h3 className="font-bold text-base mb-1 group-hover:text-blue-200 transition-colors">Student Management</h3>
                                    <p className="text-xs text-blue-100 opacity-90">Admission to graduation</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Academic Management */}
                        <motion.div
                            className="backdrop-blur-sm bg-white/10 p-5 rounded-2xl border border-white/20 hover:bg-white/15 transition-all cursor-pointer group"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex flex-col items-center text-center gap-3">
                                <motion.div
                                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <BookOpen className="w-7 h-7 text-white" />
                                </motion.div>
                                <div>
                                    <h3 className="font-bold text-base mb-1 group-hover:text-blue-200 transition-colors">Academic Management</h3>
                                    <p className="text-xs text-blue-100 opacity-90">Courses, exams & results</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Finance & Accounts */}
                        <motion.div
                            className="backdrop-blur-sm bg-white/10 p-5 rounded-2xl border border-white/20 hover:bg-white/15 transition-all cursor-pointer group"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex flex-col items-center text-center gap-3">
                                <motion.div
                                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <Wallet className="w-7 h-7 text-white" />
                                </motion.div>
                                <div>
                                    <h3 className="font-bold text-base mb-1 group-hover:text-blue-200 transition-colors">Finance & Accounts</h3>
                                    <p className="text-xs text-blue-100 opacity-90">Fee collection & reports</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* HR & Payroll */}
                        <motion.div
                            className="backdrop-blur-sm bg-white/10 p-5 rounded-2xl border border-white/20 hover:bg-white/15 transition-all cursor-pointer group"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                            whileHover={{ scale: 1.05 }}
                        >
                            <div className="flex flex-col items-center text-center gap-3">
                                <motion.div
                                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg"
                                    whileHover={{ rotate: 360 }}
                                    transition={{ duration: 0.6 }}
                                >
                                    <UserCog className="w-7 h-7 text-white" />
                                </motion.div>
                                <div>
                                    <h3 className="font-bold text-base mb-1 group-hover:text-blue-200 transition-colors">HR & Payroll</h3>
                                    <p className="text-xs text-blue-100 opacity-90">Staff & salary management</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Bottom Trust Indicators */}
                    <motion.div
                        className="space-y-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.6 }}
                    >
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                                <Clock className="w-5 h-5 text-green-300" />
                            </motion.div>
                            <span className="font-semibold">24×7 Availability</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-xl border border-white/20">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Shield className="w-5 h-5 text-blue-300" />
                            </motion.div>
                            <span className="font-semibold">Secure & Reliable</span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12" style={{ backgroundColor: '#f8f9fa' }}>
                <motion.div
                    className="w-full max-w-md"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    {/* Mobile Logo */}
                    <motion.div
                        className="lg:hidden text-center mb-8"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <span className="text-5xl font-bold" style={{ letterSpacing: '0.05em' }}>
                            <span style={{ color: '#7f56da' }}>IM</span>
                            <span className="text-blue-600">ROS</span>
                        </span>
                        <h1 className="text-xl font-bold mt-3" style={{ color: '#222f3e' }}>Campus Management System</h1>
                    </motion.div>

                    {/* Login Form Card */}
                    <motion.div
                        className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10 border border-gray-100"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                        whileHover={{ boxShadow: "0 25px 50px -12px rgba(127, 86, 218, 0.25)" }}
                    >
                        <div className="space-y-6">
                            {/* Logo */}
                            <motion.div
                                className="flex justify-center mb-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                            >
                                <img
                                    src="https://bitevns.org/static/media/college-logo.fe06591f377e3340fead.png"
                                    alt="Banaras Institute of Teacher's Education Logo"
                                    className="w-36 h-36 object-contain"
                                />
                            </motion.div>

                            <motion.div
                                className="text-center"
                                // className="space-y-5"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.6 }}
                            >
                                <h2 className="text-3xl font-bold mb-2" style={{ color: '#222f3e' }}>Welcome Back!</h2>
                                <p className="text-gray-600">
                                    {otpSent ? 'Enter the OTP sent to your mobile' : 'Sign in with your mobile number and OTP'}
                                </p>
                            </motion.div>

                            {!otpSent ? (
                                // Step 1: Phone Number Entry
                                <motion.form
                                    onSubmit={handleSendOTP}
                                    className="space-y-5"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.6 }}
                                >
                                    {/* Phone Number Field */}
                                    {/* <div>
                                        <label htmlFor="phone" className="block text-sm font-bold mb-2" style={{ color: '#222f3e' }}>
                                            Mobile No
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                <Phone className="w-5 h-5 text-gray-400" />
                                                <span className="text-gray-500 font-medium">+91</span>
                                            </div>
                                            <input
                                                id="phone"
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                required
                                                placeholder="Enter your 10-digit mobile number"
                                                className="w-full pl-20 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#7f56da]/20 focus:border-[#7f56da] transition-all text-base"
                                                disabled={isLoading}
                                                maxLength={10}
                                                ref={phoneInputRef}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1.5">We'll send you an OTP to verify your identity</p>
                                    </div> */}

                                    <div>
                                        <label htmlFor="phone" className="block text-sm font-bold mb-2" style={{ color: '#222f3e' }}>
                                            Mobile No
                                        </label>
                                        <div className="relative">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
                                                <Phone className="w-5 h-5 text-gray-400" />
                                                <span className="text-gray-500 font-medium">+91</span>
                                            </div>
                                            <input
                                                id="phone"
                                                type="tel"
                                                value={phone}
                                                onChange={(e) => setPhone(e.target.value)}
                                                required
                                                placeholder="Enter your 10-digit mobile number"
                                                className="w-full pl-20 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-[#7f56da]/20 focus:border-[#7f56da] transition-all text-base"
                                                disabled={isLoading}
                                                maxLength={10}
                                                ref={phoneInputRef}
                                            />


                                        </div>
                                        <p className="text-xs text-gray-500 mt-1.5">We'll send you an OTP to verify your identity</p>
                                    </div>

                                    {/* Submit Button */}
                                    <motion.button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full py-4 px-6 bg-gradient-to-r from-[#7f56da] to-[#6d49c5] hover:from-[#6d49c5] hover:to-[#5a38b0] text-white font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-base shadow-xl hover:shadow-2xl"
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        {isLoading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                                Sending OTP...
                                            </>
                                        ) : (
                                            <>
                                                <Phone className="w-5 h-5" />
                                                Send OTP
                                            </>
                                        )}
                                    </motion.button>
                                </motion.form>
                            ) : (
                                // Step 2: OTP Entry
                                <motion.div
                                    className="space-y-5"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    {/* Phone Number Display */}
                                    <motion.div
                                        className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border-2 border-purple-200"
                                        initial={{ scale: 0.95 }}
                                        animate={{ scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7f56da] to-[#6d49c5] flex items-center justify-center">
                                                <Phone className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-600 font-medium">Sending OTP to</p>
                                                <p className="text-base font-bold" style={{ color: '#222f3e' }}>+91 {phone}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => {
                                                setOtpSent(false);
                                                setOtp(['', '', '', '', '', '']);
                                            }}
                                            className="text-sm font-semibold hover:underline"
                                            style={{ color: '#7f56da' }}
                                        >
                                            Change
                                        </button>
                                    </motion.div>

                                    {/* OTP Input Boxes */}
                                    <motion.div

                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.2 }}
                                    >
                                        <label className="block text-sm font-bold mb-3" style={{ color: '#222f3e' }}>
                                            Enter OTP
                                        </label>

                                        <div className="flex gap-2 sm:gap-3 justify-center">
                                            {otp.map((digit, index) => (
                                                <motion.input
                                                    key={index}
                                                    type="text"
                                                    value={digit}
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                                    onPaste={handleOtpPaste}
                                                    // className="w-14 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-[#7f56da]/20 focus:border-[#7f56da] transition-all"
                                                    className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-center text-lg sm:text-xl md:text-2xl font-bold border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-4 focus:ring-[#7f56da]/20 focus:border-[#7f56da] transition-all leading-[1] p-0"
                                                    style={{ lineHeight: '1', paddingTop: '0', paddingBottom: '0' }}
                                                    disabled={isLoading}
                                                    maxLength={1}
                                                    // ref={(el) => otpRefs.current[index] = el}
                                                    ref={(el) => {
                                                        otpRefs.current[index] = el;
                                                    }}
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    transition={{ duration: 0.3, delay: 0.1 * index }}
                                                    whileFocus={{ scale: 1.05 }}
                                                />
                                            ))}

                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <p className="text-xs text-gray-500">Didn't receive the code?</p>
                                            <button
                                                type="button"
                                                onClick={handleResendOTP}
                                                disabled={isLoading}
                                                className="text-sm font-semibold hover:underline disabled:opacity-50"
                                                style={{ color: '#7f56da' }}
                                            >
                                                Resend OTP
                                            </button>
                                        </div>
                                    </motion.div>

                                    {/* Loading Indicator (when verifying) */}
                                    {isLoading && (
                                        <motion.div
                                            className="flex items-center justify-center gap-3 py-4"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <div className="w-6 h-6 border-2 border-[#7f56da] border-t-transparent rounded-full animate-spin" />
                                            <p className="text-sm font-semibold" style={{ color: '#7f56da' }}>Verifying OTP...</p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}

                            {/* Copyright */}
                            <motion.div
                                className="text-center mt-8 pt-6 border-t border-gray-200"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, delay: 0.7 }}
                            >
                                <p className="text-xs text-gray-600">
                                    © 2026 IMROS is powered by{' '}
                                    <a
                                        href="https://www.sortstring.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-[#7f56da] transition-colors"
                                    >
                                        Sort String Solutions LLP
                                    </a>
                                </p>
                            </motion.div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
}


export default Login;