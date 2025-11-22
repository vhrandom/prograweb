import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export function LoadingScreen() {
    const [progress, setProgress] = useState(0);
    const [loadingText, setLoadingText] = useState("Iniciando...");

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                return prev + Math.random() * 10;
            });
        }, 200);

        const textInterval = setInterval(() => {
            setLoadingText((prev) => {
                if (prev === "Iniciando...") return "Cargando estadísticas...";
                if (prev === "Cargando estadísticas...") return "Verificando productos...";
                if (prev === "Verificando productos...") return "Sincronizando ventas...";
                return "Preparando panel...";
            });
        }, 800);

        return () => {
            clearInterval(interval);
            clearInterval(textInterval);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-neutral-950">
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center space-y-8 max-w-md w-full px-6"
            >
                {/* Logo Animation */}
                <motion.div
                    animate={{
                        y: [0, -10, 0],
                        rotate: [0, 5, -5, 0]
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative"
                >
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 p-0.5 shadow-2xl shadow-blue-500/20">
                        <div className="w-full h-full bg-white dark:bg-neutral-900 rounded-2xl flex items-center justify-center overflow-hidden">
                            <img
                                src="/images/logo.png"
                                alt="AppleAura Logo"
                                className="w-20 h-20 object-contain"
                            />
                        </div>
                    </div>
                </motion.div>

                <div className="space-y-2 text-center">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                        AppleAura Seller
                    </motion.h2>
                    <motion.p
                        key={loadingText}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-gray-500 dark:text-gray-400 h-5"
                    >
                        {loadingText}
                    </motion.p>
                </div>

                <div className="w-full space-y-2">
                    <Progress value={progress} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-400">
                        <span>{Math.round(progress)}%</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
