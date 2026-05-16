import { Loader2 } from 'lucide-react';

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="relative">
                <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                <Loader2 className="relative h-16 w-16 text-cyan-400 animate-spin" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-white">Loading DevSentinel...</h2>
            <p className="mt-2 text-gray-400">Securing your environment</p>
        </div>
    );
}
