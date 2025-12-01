import React, { useState } from 'react';
import { Mail, LogIn, ShieldCheck, ArrowRight } from 'lucide-react';

interface AuthOverlayProps {
    onMagicLink: (email: string) => Promise<void>;
    onOAuth: (provider: 'google' | 'github') => Promise<void>;
    magicLinkSent: boolean;
    authError?: string | null;
}

export const AuthOverlay: React.FC<AuthOverlayProps> = ({
    onMagicLink,
    onOAuth,
    magicLinkSent,
    authError
}) => {
    const [email, setEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSubmitting(true);
        try {
            await onMagicLink(email);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,#0ea5e9,transparent_40%)]" />
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_bottom_right,#22d3ee,transparent_35%)]" />
            <div className="relative w-full max-w-xl mx-auto p-8">
                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-10 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-cyan-500/15 border border-cyan-400/30">
                            <ShieldCheck className="text-cyan-300" size={26} />
                        </div>
                        <div>
                            <p className="uppercase tracking-[0.2em] text-xs text-white/60 font-semibold">Secure Workspace</p>
                            <h2 className="text-3xl font-display font-bold text-white leading-tight">Sign in to sync</h2>
                        </div>
                    </div>

                    <p className="text-white/70 leading-relaxed">
                        We use Supabase Auth so every device stays in sync. Send yourself a magic link or continue with a provider to start planning.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="block text-sm font-semibold text-white/70">Email for magic link</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-2xl border border-white/10 bg-white/5 focus-within:border-cyan-400/60 focus-within:bg-white/10 transition-colors">
                                <Mail size={18} className="text-white/60" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="bg-transparent flex-1 outline-none text-white placeholder:text-white/40"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-semibold bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/40 hover:bg-cyan-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <LogIn size={18} />
                                {submitting ? 'Sending…' : 'Send link'}
                            </button>
                        </div>
                    </form>

                    <div className="flex flex-col gap-3">
                        <button
                            type="button"
                            onClick={() => onOAuth('google')}
                            className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-2xl border border-white/10 bg-white/5 text-white font-semibold hover:border-white/30 hover:bg-white/10 transition-colors"
                        >
                            Continue with Google
                            <ArrowRight size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => onOAuth('github')}
                            className="w-full inline-flex items-center justify-center gap-3 px-5 py-3 rounded-2xl border border-white/10 bg-white/5 text-white font-semibold hover:border-white/30 hover:bg-white/10 transition-colors"
                        >
                            Continue with GitHub
                            <ArrowRight size={18} />
                        </button>
                    </div>

                    {magicLinkSent && (
                        <div className="text-sm text-emerald-300 font-semibold bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-3">
                            Magic link sent! Check your inbox.
                        </div>
                    )}

                    {authError && (
                        <div className="text-sm text-rose-300 font-semibold bg-rose-500/10 border border-rose-500/30 rounded-2xl p-3">
                            {authError}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
