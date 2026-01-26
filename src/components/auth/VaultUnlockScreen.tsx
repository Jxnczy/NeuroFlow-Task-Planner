import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, ShieldCheck, AlertTriangle, Eye, EyeOff, KeyRound } from 'lucide-react';

interface VaultUnlockScreenProps {
    isVaultSetup: boolean;
    isLoading: boolean;
    error: string | null;
    onSetup: (passphrase: string) => Promise<boolean>;
    onUnlock: (passphrase: string) => Promise<boolean>;
    onReset: () => void;
    onSkip?: () => void; // Allow skipping encryption (local-only mode)
}

export const VaultUnlockScreen: React.FC<VaultUnlockScreenProps> = React.memo(({
    isVaultSetup,
    isLoading,
    error,
    onSetup,
    onUnlock,
    onReset,
    onSkip
}) => {
    const [passphrase, setPassphrase] = useState('');
    const [confirmPassphrase, setConfirmPassphrase] = useState('');
    const [showPassphrase, setShowPassphrase] = useState(false);
    const [showResetConfirm, setShowResetConfirm] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!isVaultSetup) {
            // Setup mode - validate passphrase
            if (passphrase.length < 8) {
                setLocalError('Passphrase must be at least 8 characters');
                return;
            }
            if (passphrase !== confirmPassphrase) {
                setLocalError('Passphrases do not match');
                return;
            }
            await onSetup(passphrase);
        } else {
            // Unlock mode
            await onUnlock(passphrase);
        }
    };

    const handleReset = () => {
        onReset();
        setShowResetConfirm(false);
        setPassphrase('');
        setConfirmPassphrase('');
    };

    const displayError = localError || error;

    return (
        <motion.div
            className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            {/* Animated background */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#0ea5e9,transparent_40%)]"
            />
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.2 }}
                transition={{ duration: 1.5, delay: 0.3 }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,#22d3ee,transparent_35%)]"
            />

            <AnimatePresence mode="wait">
                {showResetConfirm ? (
                    <motion.div
                        key="reset-confirm"
                        className="relative w-full max-w-md mx-auto p-8"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 backdrop-blur-xl shadow-2xl p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-400/30">
                                    <AlertTriangle className="text-rose-400" size={26} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-white">Reset Vault?</h2>
                                    <p className="text-rose-300/80 text-sm">This cannot be undone</p>
                                </div>
                            </div>

                            <p className="text-white/70 leading-relaxed">
                                This will <strong className="text-rose-300">permanently delete all encrypted data</strong>.
                                You will need to set up a new passphrase and all existing tasks, habits, and notes will be lost.
                            </p>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowResetConfirm(false)}
                                    className="flex-1 px-5 py-3 rounded-2xl border border-white/20 bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleReset}
                                    className="flex-1 px-5 py-3 rounded-2xl bg-rose-500 text-white font-semibold hover:bg-rose-400 transition-colors"
                                >
                                    Yes, Reset Everything
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="unlock-form"
                        className="relative w-full max-w-md mx-auto p-8"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.5 }}
                    >
                        <motion.div
                            className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-10 space-y-8"
                            initial={{ boxShadow: "0 0 0 rgba(6, 182, 212, 0)" }}
                            animate={{ boxShadow: "0 0 60px rgba(6, 182, 212, 0.1)" }}
                            transition={{ duration: 1, delay: 0.3 }}
                        >
                            {/* Header */}
                            <motion.div
                                className="flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/30">
                                    {isVaultSetup ? (
                                        <Lock className="text-cyan-300" size={26} />
                                    ) : (
                                        <ShieldCheck className="text-cyan-300" size={26} />
                                    )}
                                </div>
                                <div>
                                    <p className="uppercase tracking-[0.2em] text-xs text-white/60 font-semibold">
                                        {isVaultSetup ? 'Encrypted Vault' : 'End-to-End Encryption'}
                                    </p>
                                    <h2 className="text-2xl font-display font-bold text-white leading-tight">
                                        {isVaultSetup ? 'Unlock Your Data' : 'Secure Your Data'}
                                    </h2>
                                </div>
                            </motion.div>

                            <motion.p
                                className="text-white/70 leading-relaxed"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                {isVaultSetup ? (
                                    <>Enter your vault passphrase to decrypt and access your data.</>
                                ) : (
                                    <>
                                        Create a passphrase to encrypt your data.
                                        <span className="text-amber-300"> This passphrase cannot be recovered if forgotten.</span>
                                    </>
                                )}
                            </motion.p>

                            {/* Form */}
                            <motion.form
                                onSubmit={handleSubmit}
                                className="space-y-4"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                {/* Passphrase Input */}
                                <div>
                                    <label className="block text-sm font-semibold text-white/70 mb-2">
                                        {isVaultSetup ? 'Passphrase' : 'Create Passphrase'}
                                    </label>
                                    {/* Hidden username field for accessibility/browser autofill heuristics */}
                                    <input type="text" name="username" autoComplete="username" style={{ display: 'none' }} />
                                    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 focus-within:border-cyan-400/60 focus-within:bg-white/10 transition-colors">
                                        <KeyRound size={18} className="text-white/60" />
                                        <input
                                            type={showPassphrase ? 'text' : 'password'}
                                            value={passphrase}
                                            onChange={(e) => setPassphrase(e.target.value)}
                                            placeholder="Enter your passphrase"
                                            className="bg-transparent flex-1 outline-none text-white placeholder:text-white/40"
                                            required
                                            minLength={8}
                                            autoFocus
                                            autoComplete="new-password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassphrase(!showPassphrase)}
                                            className="text-white/40 hover:text-white/70 transition-colors"
                                        >
                                            {showPassphrase ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Confirm Passphrase (setup only) */}
                                {!isVaultSetup && (
                                    <div>
                                        <label className="block text-sm font-semibold text-white/70 mb-2">
                                            Confirm Passphrase
                                        </label>
                                        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 focus-within:border-cyan-400/60 focus-within:bg-white/10 transition-colors">
                                            <KeyRound size={18} className="text-white/60" />
                                            <input
                                                type={showPassphrase ? 'text' : 'password'}
                                                value={confirmPassphrase}
                                                onChange={(e) => setConfirmPassphrase(e.target.value)}
                                                placeholder="Confirm your passphrase"
                                                className="bg-transparent flex-1 outline-none text-white placeholder:text-white/40"
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40 hover:bg-cyan-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <motion.div
                                                className="w-5 h-5 border-2 border-slate-950/30 border-t-slate-950 rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                            />
                                            {isVaultSetup ? 'Unlocking...' : 'Setting up...'}
                                        </>
                                    ) : (
                                        <>
                                            <Unlock size={18} />
                                            {isVaultSetup ? 'Unlock Vault' : 'Enable Encryption'}
                                        </>
                                    )}
                                </button>
                            </motion.form>

                            {/* Error Message */}
                            <AnimatePresence>
                                {displayError && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="text-sm text-rose-300 font-semibold bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3"
                                    >
                                        {displayError}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Footer Actions */}
                            <motion.div
                                className="pt-4 border-t border-white/10 space-y-3"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                            >
                                {isVaultSetup && (
                                    <button
                                        type="button"
                                        onClick={() => setShowResetConfirm(true)}
                                        className="w-full px-5 py-2 rounded-xl text-rose-400/80 text-sm hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
                                    >
                                        Forgot passphrase? Reset vault
                                    </button>
                                )}

                                {onSkip && (
                                    <button
                                        type="button"
                                        onClick={onSkip}
                                        className="w-full px-5 py-2 rounded-xl text-white/50 text-sm hover:text-white/70 transition-colors"
                                    >
                                        Skip encryption (not recommended)
                                    </button>
                                )}
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});
