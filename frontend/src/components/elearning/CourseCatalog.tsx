'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, BookOpen } from "lucide-react";
import { motion } from "framer-motion";

const courseCardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const CourseCatalog = () => {
  // Données factices pour les cours
  const courses = [
    { id: 1, title: 'Introduction à la Télémédecine', progress: 75, image: 'https://via.placeholder.com/150/0D6E79/FFFFFF?text=Cours1' },
    { id: 2, title: 'Gestion du DSE sur Hedera', progress: 30, image: 'https://via.placeholder.com/150/59B14E/FFFFFF?text=Cours2' },
    { id: 3, title: 'Éthique et IA en Santé', progress: 0, image: 'https://via.placeholder.com/150/183D4C/FFFFFF?text=Cours3' },
    { id: 4, title: 'Premiers Secours Avancés', progress: 100, image: 'https://via.placeholder.com/150/0D6E79/FFFFFF?text=Cours4' },
  ];

  return (
    <Card className="bg-blanc-pur shadow-md rounded-2xl h-full">
      <CardHeader>
        <CardTitle className="text-nuit-confiance">Catalogue de Cours</CardTitle>
        <CardDescription className="text-nuit-confiance/80">Explorez nos formations et développez vos compétences.</CardDescription>
        <div className="relative mt-4">
          <Input placeholder="Rechercher un cours..." className="pl-10" />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-nuit-confiance/60" />
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {courses.map(course => (
          <motion.div key={course.id} variants={courseCardVariants}>
            <Card className="flex items-center space-x-4 p-4 bg-fond-doux rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
              <img src={course.image} alt={course.title} className="w-16 h-16 rounded-md object-cover" />
              <div className="flex-1">
                <h3 className="font-semibold text-nuit-confiance">{course.title}</h3>
                <p className="text-sm text-nuit-confiance/70">Progression : {course.progress}%</p>
                {/* Barre de progression simple */}
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-aqua-moderne h-2 rounded-full" style={{ width: `${course.progress}%` }}></div>
                </div>
              </div>
              <BookOpen className="w-6 h-6 text-aqua-moderne" />
            </Card>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CourseCatalog;
