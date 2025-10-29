"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface ShortcutProps {
  icon: React.ReactNode;
  title: string;
  emoji: string;
  onClick?: () => void;
}

export default function Shortcut({ icon, title, emoji, onClick }: ShortcutProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className="w-full h-full bg-blanc-pur shadow-lg rounded-2xl overflow-hidden transform transition-transform duration-300 hover:shadow-2xl hover:bg-gray-50">
        <CardHeader className="flex flex-row items-start justify-between p-4">
          <CardTitle className="text-xl font-bold text-nuit-confiance">{title}</CardTitle>
          <span className="text-3xl ml-2">{emoji}</span>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-6">
          {icon}
        </CardContent>
      </Card>
    </motion.div>
  );
}
